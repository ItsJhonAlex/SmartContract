// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IYieldFarming.sol";
import "../libraries/YieldMath.sol";

/**
 * @title BaseModule
 * @dev Módulo base para el sistema de Yield Farming de OXO
 * Contiene variables compartidas y funcionalidad base
 * Integrado con Staking y Tier System
 */
abstract contract BaseModule is Ownable, ReentrancyGuard, Pausable {
    using YieldMath for uint256;
    
    // Constantes del sistema
    uint256 public constant MAX_POOLS = 50;
    uint256 public constant MIN_LIQUIDITY = 1000; // Mínimo de liquidez para crear pool
    uint256 public constant STAKING_BONUS_MULTIPLIER = 1250; // 1.25x bonus por staking
    
    // Direcciones de contratos del ecosistema OXO
    address public oxsTokenAddress;      // Dirección del token OXS
    address public stakingContractAddress;  // Dirección del contrato de staking
    address public tierContractAddress;     // Dirección del contrato de tiers
    
    // Variables de estado del protocolo
    uint256 public totalPools;
    uint256 public totalValueLocked;     // TVL total en USD
    uint256 public totalRewardsDistributed;
    uint256 public protocolFeePercentage = 1000; // 10% en basis points
    
    // Mapeos principales
    mapping(uint256 => IYieldFarming.PoolInfo) public pools;
    mapping(address => mapping(uint256 => IYieldFarming.UserPoolInfo)) public userPoolInfo;
    mapping(address => uint256[]) public userActivePools;
    mapping(uint256 => bool) public poolExists;
    
    // Array de pools activos
    uint256[] public activePools;
    
    // Eventos del sistema base
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee, uint256 timestamp);
    event ContractAddressUpdated(string contractType, address oldAddress, address newAddress);
    event EmergencyWithdrawal(address indexed user, uint256 indexed poolId, uint256 amount);
    
    /**
     * @dev Constructor del módulo base
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        // Inicialización básica
    }
    
    /**
     * @dev Inicializa las direcciones de los contratos del ecosistema
     * @param _oxsToken Dirección del token OXS
     * @param _stakingContract Dirección del contrato de staking
     * @param _tierContract Dirección del contrato de tiers
     */
    function initializeContracts(
        address _oxsToken,
        address _stakingContract,
        address _tierContract
    ) external onlyOwner {
        require(_oxsToken != address(0), "OXS token address no puede ser 0");
        require(_stakingContract != address(0), "Staking contract address no puede ser 0");
        require(_tierContract != address(0), "Tier contract address no puede ser 0");
        
        oxsTokenAddress = _oxsToken;
        stakingContractAddress = _stakingContract;
        tierContractAddress = _tierContract;
        
        emit ContractAddressUpdated("OXS_TOKEN", address(0), _oxsToken);
        emit ContractAddressUpdated("STAKING_CONTRACT", address(0), _stakingContract);
        emit ContractAddressUpdated("TIER_CONTRACT", address(0), _tierContract);
    }
    
    /**
     * @dev Obtiene el tier actual de un usuario desde el contrato de tiers
     * @param user Dirección del usuario
     * @return Tier del usuario (0-3)
     */
    function getUserTier(address user) public view returns (uint256) {
        if (tierContractAddress == address(0)) {
            return 0; // Sin tier si no hay contrato configurado
        }
        
        try this.externalGetUserTier(user) returns (uint256 tier) {
            return tier;
        } catch {
            return 0; // En caso de error, sin tier
        }
    }
    
    /**
     * @dev Función externa para obtener tier (para manejo de errores)
     * @param user Dirección del usuario
     * @return Tier del usuario
     */
    function externalGetUserTier(address user) external view returns (uint256) {
        // Llamada al contrato de tiers (implementación específica según el contrato)
        (bool success, bytes memory result) = tierContractAddress.staticcall(
            abi.encodeWithSignature("getUserTierInfo(address)", user)
        );
        
        if (success && result.length >= 32) {
            return abi.decode(result, (uint256));
        }
        
        return 0;
    }
    
    /**
     * @dev Verifica si un usuario tiene staking activo
     * @param user Dirección del usuario
     * @return true si tiene staking activo
     */
    function hasActiveStaking(address user) public view returns (bool) {
        if (stakingContractAddress == address(0)) {
            return false;
        }
        
        try this.externalCheckStaking(user) returns (bool hasStaking) {
            return hasStaking;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Función externa para verificar staking (para manejo de errores)
     * @param user Dirección del usuario
     * @return true si tiene staking activo
     */
    function externalCheckStaking(address user) external view returns (bool) {
        // Llamada al contrato de staking
        (bool success, bytes memory result) = stakingContractAddress.staticcall(
            abi.encodeWithSignature("getStakedBalance(address)", user)
        );
        
        if (success && result.length >= 32) {
            uint256 stakedAmount = abi.decode(result, (uint256));
            return stakedAmount > 0;
        }
        
        return false;
    }
    
    /**
     * @dev Calcula el multiplicador total para un usuario
     * @param user Dirección del usuario
     * @param poolId ID del pool
     * @return tierMultiplier Multiplicador por tier
     * @return stakingBonus Bonus por staking
     * @return timeBonus Bonus por tiempo (usando progresión exponencial)
     */
    function calculateUserMultipliers(
        address user,
        uint256 poolId
    ) public view returns (
        uint256 tierMultiplier,
        uint256 stakingBonus,
        uint256 timeBonus
    ) {
        require(poolExists[poolId], "Pool no existe");
        
        // Tier multiplier
        uint256 userTier = getUserTier(user);
        tierMultiplier = YieldMath.calculateTierMultiplier(userTier, pools[poolId].maxMultiplier);
        
        // Staking bonus
        stakingBonus = hasActiveStaking(user) ? STAKING_BONUS_MULTIPLIER : 1000;
        
        // Time bonus usando progresión exponencial (similar al sistema de staking/tier)
        uint256 stakingTime = userPoolInfo[user][poolId].stakingStartTime;
        if (stakingTime > 0) {
            uint256 weeksStaked = (block.timestamp - stakingTime).secondsToWeeks();
            timeBonus = calculateExponentialTimeBonus(weeksStaked);
        } else {
            timeBonus = 600; // 6% inicial
        }
    }
    
    /**
     * @dev Calcula el bonus exponencial por tiempo (misma fórmula que staking/tier)
     * @param weeksStaked Semanas de participación
     * @return Bonus exponencial (600-10000, representando 6%-100%)
     */
    function calculateExponentialTimeBonus(uint256 weeksStaked) public pure returns (uint256) {
        // Implementación simplificada de la progresión exponencial
        // En un contrato real, usaríamos la misma lógica que LogarithmLib
        
        if (weeksStaked == 0) return 600;  // 6%
        if (weeksStaked >= 104) return 10000; // 100%
        
        // Progresión exponencial simplificada
        // Para ser exacto, deberíamos importar LogarithmLib del TierContract
        if (weeksStaked <= 26) return 600 + (weeksStaked * 50);  // Crecimiento inicial
        if (weeksStaked <= 52) return 1900 + ((weeksStaked - 26) * 180); // Crecimiento medio
        
        // Crecimiento final más acelerado
        return 6580 + ((weeksStaked - 52) * 66);
    }
    
    /**
     * @dev Actualiza el fee del protocolo
     * @param newFeePercentage Nuevo fee en basis points
     */
    function updateProtocolFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 2000, "Fee no puede ser mayor al 20%");
        
        uint256 oldFee = protocolFeePercentage;
        protocolFeePercentage = newFeePercentage;
        
        emit ProtocolFeeUpdated(oldFee, newFeePercentage, block.timestamp);
    }
    
    /**
     * @dev Pausa todas las operaciones del protocolo
     */
    function pauseProtocol() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Despausa todas las operaciones del protocolo
     */
    function unpauseProtocol() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Obtiene estadísticas generales del protocolo
     * @return _totalPools Número total de pools
     * @return _totalValueLocked TVL total
     * @return _totalRewardsDistributed Total de rewards distribuidos
     * @return _activePools Número de pools activos
     */
    function getProtocolStats() external view returns (
        uint256 _totalPools,
        uint256 _totalValueLocked,
        uint256 _totalRewardsDistributed,
        uint256 _activePools
    ) {
        return (
            totalPools,
            totalValueLocked,
            totalRewardsDistributed,
            activePools.length
        );
    }
    
    /**
     * @dev Verifica si un pool está activo
     * @param poolId ID del pool
     * @return true si está activo
     */
    function isPoolActive(uint256 poolId) public view returns (bool) {
        return poolExists[poolId] && pools[poolId].isActive;
    }
    
    /**
     * @dev Modifier para verificar que un pool existe y está activo
     * @param poolId ID del pool
     */
    modifier validActivePool(uint256 poolId) {
        require(isPoolActive(poolId), "Pool no existe o no esta activo");
        _;
    }
} 