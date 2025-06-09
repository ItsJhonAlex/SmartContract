// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IYieldFarming.sol";
import "../modules/BaseModule.sol";
import "../libraries/YieldMath.sol";

/**
 * @title OXSYieldFarming
 * @dev Contrato principal de Yield Farming para el ecosistema OXO
 * Implementa las fórmulas de fee con vesting y liquidity mining
 * Integrado con Staking y Tier System para maximizar rewards
 */
contract OXSYieldFarming is IYieldFarming, BaseModule {
    using SafeERC20 for IERC20;
    using YieldMath for uint256;
    
    // Constantes específicas del yield farming
    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public constant MIN_DEPOSIT_AMOUNT = 1000; // Mínimo para depositar
    uint256 public constant MAX_POOLS_PER_USER = 10;   // Máximo pools por usuario
    
    /**
     * @dev Constructor del contrato principal
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(address initialOwner) BaseModule(initialOwner) {
        // Constructor vacío, inicialización en BaseModule
    }
    
    /**
     * @dev Crea un nuevo pool de yield farming
     * @param tokenA Dirección del token A
     * @param tokenB Dirección del token B  
     * @param baseAPY APY base en basis points
     * @param maxMultiplier Multiplicador máximo por tier
     * @param feeInitial Fee inicial para vesting (basis points)
     * @param feeFinal Fee final para vesting (basis points)
     * @param vestingWeeks Semanas máximas de vesting
     * @return poolId ID del pool creado
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint256 baseAPY,
        uint256 maxMultiplier,
        uint256 feeInitial,
        uint256 feeFinal,
        uint256 vestingWeeks
    ) external override onlyOwner whenNotPaused returns (uint256 poolId) {
        require(totalPools < MAX_POOLS, "Maximo numero de pools alcanzado");
        require(tokenA != address(0) && tokenB != address(0), "Direcciones de tokens invalidas");
        require(tokenA != tokenB, "Tokens deben ser diferentes");
        require(
            YieldMath.validatePoolParameters(feeInitial, feeFinal, vestingWeeks, baseAPY),
            "Parametros del pool invalidos"
        );
        
        poolId = totalPools;
        
        pools[poolId] = PoolInfo({
            tokenA: tokenA,
            tokenB: tokenB,
            totalLiquidity: 0,
            baseAPY: baseAPY,
            maxMultiplier: maxMultiplier,
            totalRewards: 0,
            lastRewardTime: block.timestamp,
            isActive: true,
            feeInitial: feeInitial,
            feeFinal: feeFinal,
            vestingWeeks: vestingWeeks
        });
        
        poolExists[poolId] = true;
        activePools.push(poolId);
        totalPools++;
        
        emit PoolCreated(poolId, tokenA, tokenB, baseAPY, block.timestamp);
    }
    
    /**
     * @dev Deposita liquidez en un pool
     * @param poolId ID del pool
     * @param amountA Cantidad del token A
     * @param amountB Cantidad del token B
     */
    function depositLiquidity(
        uint256 poolId,
        uint256 amountA,
        uint256 amountB
    ) external override nonReentrant whenNotPaused validActivePool(poolId) {
        require(amountA >= MIN_DEPOSIT_AMOUNT && amountB >= MIN_DEPOSIT_AMOUNT, "Cantidades minimas no alcanzadas");
        require(
            userActivePools[msg.sender].length < MAX_POOLS_PER_USER,
            "Maximo de pools por usuario alcanzado"
        );
        
        PoolInfo storage pool = pools[poolId];
        UserPoolInfo storage userInfo = userPoolInfo[msg.sender][poolId];
        
        // Transferir tokens al contrato
        IERC20(pool.tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).safeTransferFrom(msg.sender, address(this), amountB);
        
        // Calcular liquidez aportada (usando media geométrica simplificada)
        uint256 liquidityAmount = (amountA + amountB) / 2;
        
        // Actualizar información del usuario
        if (!userInfo.isActive) {
            userInfo.stakingStartTime = block.timestamp;
            userInfo.isActive = true;
            userActivePools[msg.sender].push(poolId);
        }
        
        // Actualizar pending rewards antes de cambiar la liquidez
        _updatePendingRewards(msg.sender, poolId);
        
        userInfo.liquidityAmount += liquidityAmount;
        pool.totalLiquidity += liquidityAmount;
        totalValueLocked += liquidityAmount; // Simplificado, en realidad sería en USD
        
        emit LiquidityDeposited(msg.sender, poolId, amountA, amountB, block.timestamp);
    }
    
    /**
     * @dev Retira liquidez de un pool
     * @param poolId ID del pool
     * @param liquidityAmount Cantidad de liquidez a retirar
     */
    function withdrawLiquidity(
        uint256 poolId,
        uint256 liquidityAmount
    ) external override nonReentrant validActivePool(poolId) {
        UserPoolInfo storage userInfo = userPoolInfo[msg.sender][poolId];
        require(userInfo.isActive, "Usuario no tiene liquidez en este pool");
        require(liquidityAmount <= userInfo.liquidityAmount, "Cantidad insuficiente");
        
        // Actualizar pending rewards antes de retirar
        _updatePendingRewards(msg.sender, poolId);
        
        // Calcular fee dinámico según vesting
        uint256 dynamicFee = calculateDynamicFee(msg.sender, poolId);
        uint256 feeAmount = (liquidityAmount * dynamicFee) / YieldMath.PRECISION;
        uint256 netAmount = liquidityAmount - feeAmount;
        
        PoolInfo storage pool = pools[poolId];
        
        // Actualizar estados
        userInfo.liquidityAmount -= liquidityAmount;
        pool.totalLiquidity -= liquidityAmount;
        totalValueLocked -= liquidityAmount;
        
        // Si el usuario retira toda su liquidez, marcarlo como inactivo
        if (userInfo.liquidityAmount == 0) {
            userInfo.isActive = false;
            _removeUserFromActivePool(msg.sender, poolId);
        }
        
        // Calcular cantidades de tokens a devolver (simplificado)
        uint256 tokenAAmount = netAmount / 2;
        uint256 tokenBAmount = netAmount / 2;
        
        // Transferir tokens de vuelta al usuario
        IERC20(pool.tokenA).safeTransfer(msg.sender, tokenAAmount);
        IERC20(pool.tokenB).safeTransfer(msg.sender, tokenBAmount);
        
        emit LiquidityWithdrawn(msg.sender, poolId, tokenAAmount, tokenBAmount, feeAmount, block.timestamp);
    }
    
    /**
     * @dev Reclama rewards de un pool
     * @param poolId ID del pool
     */
    function claimRewards(uint256 poolId) external override nonReentrant validActivePool(poolId) {
        UserPoolInfo storage userInfo = userPoolInfo[msg.sender][poolId];
        require(userInfo.isActive, "Usuario no activo en este pool");
        
        _updatePendingRewards(msg.sender, poolId);
        
        uint256 rewardAmount = userInfo.pendingRewards;
        require(rewardAmount > 0, "No hay rewards para reclamar");
        
        userInfo.pendingRewards = 0;
        userInfo.claimedRewards += rewardAmount;
        userInfo.lastClaimTime = block.timestamp;
        totalRewardsDistributed += rewardAmount;
        
        // Transferir rewards en OXS tokens
        IERC20(oxsTokenAddress).safeTransfer(msg.sender, rewardAmount);
        
        emit RewardsClaimed(msg.sender, poolId, rewardAmount, block.timestamp);
    }
    
    /**
     * @dev Calcula rewards detallados para un usuario
     * @param user Dirección del usuario
     * @param poolId ID del pool
     * @return calculation Estructura con detalles del cálculo
     */
    function calculateRewards(
        address user,
        uint256 poolId
    ) external view override returns (RewardCalculation memory calculation) {
        require(poolExists[poolId], "Pool no existe");
        
        UserPoolInfo storage userInfo = userPoolInfo[user][poolId];
        if (!userInfo.isActive || userInfo.liquidityAmount == 0) {
            return calculation; // Retorna valores cero
        }
        
        PoolInfo storage pool = pools[poolId];
        
        // Obtener multiplicadores
        (uint256 tierMultiplier, uint256 stakingBonus, uint256 timeBonus) = 
            calculateUserMultipliers(user, poolId);
        
        // Calcular APY efectivo
        uint256 effectiveAPY = YieldMath.calculateEffectiveAPY(
            pool.baseAPY,
            tierMultiplier,
            timeBonus,
            stakingBonus
        );
        
        // Calcular tiempo transcurrido desde última actualización
        uint256 timeElapsed = block.timestamp - userInfo.lastClaimTime;
        if (userInfo.lastClaimTime == 0) {
            timeElapsed = block.timestamp - userInfo.stakingStartTime;
        }
        
        // Calcular reward base
        calculation.baseReward = YieldMath.calculateBaseRewards(
            userInfo.liquidityAmount,
            effectiveAPY,
            timeElapsed
        );
        
        // Llenar estructura de retorno
        calculation.tierMultiplier = tierMultiplier;
        calculation.timeBonus = timeBonus;
        calculation.stakingBonus = stakingBonus;
        calculation.finalReward = calculation.baseReward;
        calculation.dynamicFee = calculateDynamicFee(user, poolId);
    }
    
    /**
     * @dev Calcula el fee dinámico con vesting para un usuario
     * Implementa la fórmula: fee(S) = X_init - ((X_init - X_fin) × S / S_max)
     * @param user Dirección del usuario
     * @param poolId ID del pool
     * @return Fee dinámico en basis points
     */
    function calculateDynamicFee(
        address user,
        uint256 poolId
    ) public view override returns (uint256) {
        require(poolExists[poolId], "Pool no existe");
        
        UserPoolInfo storage userInfo = userPoolInfo[user][poolId];
        if (!userInfo.isActive) {
            return pools[poolId].feeInitial; // Fee máximo si no está activo
        }
        
        PoolInfo storage pool = pools[poolId];
        uint256 weeksStaked = (block.timestamp - userInfo.stakingStartTime).secondsToWeeks();
        
        return YieldMath.calculateDynamicFee(
            pool.feeInitial,
            pool.feeFinal,
            weeksStaked,
            pool.vestingWeeks
        );
    }
    
    /**
     * @dev Actualiza los rewards pendientes de un usuario
     * @param user Dirección del usuario
     * @param poolId ID del pool
     */
    function _updatePendingRewards(address user, uint256 poolId) internal {
        UserPoolInfo storage userInfo = userPoolInfo[user][poolId];
        
        if (!userInfo.isActive || userInfo.liquidityAmount == 0) {
            return;
        }
        
        RewardCalculation memory calc = this.calculateRewards(user, poolId);
        userInfo.pendingRewards += calc.finalReward;
    }
    
    /**
     * @dev Remueve un usuario de la lista de pools activos
     * @param user Dirección del usuario
     * @param poolId ID del pool a remover
     */
    function _removeUserFromActivePool(address user, uint256 poolId) internal {
        uint256[] storage userPools = userActivePools[user];
        for (uint256 i = 0; i < userPools.length; i++) {
            if (userPools[i] == poolId) {
                userPools[i] = userPools[userPools.length - 1];
                userPools.pop();
                break;
            }
        }
    }
    
    // Funciones de información (implementación de la interfaz)
    
    function getPoolInfo(uint256 poolId) external view override returns (PoolInfo memory) {
        require(poolExists[poolId], "Pool no existe");
        return pools[poolId];
    }
    
    function getUserPoolInfo(address user, uint256 poolId) external view override returns (UserPoolInfo memory) {
        return userPoolInfo[user][poolId];
    }
    
    function getTotalPools() external view override returns (uint256) {
        return totalPools;
    }
    
    function getUserActivePoolsCount(address user) external view override returns (uint256) {
        return userActivePools[user].length;
    }
    
    // Funciones administrativas
    
    function updatePoolAPY(uint256 poolId, uint256 newBaseAPY) external override onlyOwner validActivePool(poolId) {
        require(newBaseAPY > 0 && newBaseAPY <= 50000, "APY invalido");
        
        pools[poolId].baseAPY = newBaseAPY;
        
        emit PoolUpdated(poolId, newBaseAPY, pools[poolId].maxMultiplier, block.timestamp);
    }
    
    function updatePoolMultiplier(uint256 poolId, uint256 newMaxMultiplier) external override onlyOwner validActivePool(poolId) {
        require(newMaxMultiplier >= 1000 && newMaxMultiplier <= 5000, "Multiplicador invalido");
        
        pools[poolId].maxMultiplier = newMaxMultiplier;
        
        emit PoolUpdated(poolId, pools[poolId].baseAPY, newMaxMultiplier, block.timestamp);
    }
    
    function pausePool(uint256 poolId) external override onlyOwner {
        require(poolExists[poolId], "Pool no existe");
        pools[poolId].isActive = false;
    }
    
    function unpausePool(uint256 poolId) external override onlyOwner {
        require(poolExists[poolId], "Pool no existe");
        pools[poolId].isActive = true;
    }
    
    function emergencyWithdraw(uint256 poolId) external override nonReentrant {
        UserPoolInfo storage userInfo = userPoolInfo[msg.sender][poolId];
        require(userInfo.isActive && userInfo.liquidityAmount > 0, "Sin liquidez para retirar");
        
        uint256 liquidityAmount = userInfo.liquidityAmount;
        PoolInfo storage pool = pools[poolId];
        
        // Aplicar fee de emergencia (5%)
        uint256 emergencyFee = (liquidityAmount * 500) / YieldMath.PRECISION;
        uint256 netAmount = liquidityAmount - emergencyFee;
        
        // Resetear información del usuario
        userInfo.liquidityAmount = 0;
        userInfo.isActive = false;
        _removeUserFromActivePool(msg.sender, poolId);
        
        // Actualizar pool
        pool.totalLiquidity -= liquidityAmount;
        totalValueLocked -= liquidityAmount;
        
        // Transferir tokens (distribución 50/50 simplificada)
        uint256 tokenAAmount = netAmount / 2;
        uint256 tokenBAmount = netAmount / 2;
        
        IERC20(pool.tokenA).safeTransfer(msg.sender, tokenAAmount);
        IERC20(pool.tokenB).safeTransfer(msg.sender, tokenBAmount);
        
        emit EmergencyWithdrawal(msg.sender, poolId, netAmount);
    }
} 