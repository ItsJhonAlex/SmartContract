// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title IYieldFarming
 * @dev Interface principal para el sistema de Yield Farming de OXO
 * Implementa Liquidity Mining con fees dinámicos basados en vesting y tiers
 */
interface IYieldFarming {
    
    // Estructuras de datos
    struct PoolInfo {
        address tokenA;              // Token A del par
        address tokenB;              // Token B del par
        uint256 totalLiquidity;      // Liquidez total del pool (LTP)
        uint256 baseAPY;            // APY base del pool (en basis points)
        uint256 maxMultiplier;      // Multiplicador máximo según tier
        uint256 totalRewards;       // Total rewards acumulados
        uint256 lastRewardTime;     // Última vez que se calcularon rewards
        bool isActive;              // Si el pool está activo
        uint256 feeInitial;         // Fee inicial (X_init) en basis points
        uint256 feeFinal;           // Fee final (X_fin) en basis points
        uint256 vestingWeeks;       // Semanas máximas de vesting (S_max)
    }
    
    struct UserPoolInfo {
        uint256 liquidityAmount;    // Cantidad de liquidez aportada (CLP)
        uint256 stakingStartTime;   // Tiempo de inicio de staking
        uint256 pendingRewards;     // Rewards pendientes de reclamar
        uint256 claimedRewards;     // Rewards ya reclamados
        uint256 lastClaimTime;      // Última vez que reclamó rewards
        bool isActive;              // Si el usuario está activo en el pool
    }
    
    struct RewardCalculation {
        uint256 baseReward;         // Reward base calculado
        uint256 tierMultiplier;     // Multiplicador por tier
        uint256 timeBonus;          // Bonus por tiempo (progresión exponencial)
        uint256 stakingBonus;       // Bonus si también hace staking
        uint256 finalReward;        // Reward final después de todos los cálculos
        uint256 dynamicFee;         // Fee dinámico actual según vesting
    }
    
    // Eventos
    event PoolCreated(
        uint256 indexed poolId,
        address tokenA,
        address tokenB,
        uint256 baseAPY,
        uint256 timestamp
    );
    
    event LiquidityDeposited(
        address indexed user,
        uint256 indexed poolId,
        uint256 amountA,
        uint256 amountB,
        uint256 timestamp
    );
    
    event LiquidityWithdrawn(
        address indexed user,
        uint256 indexed poolId,
        uint256 amountA,
        uint256 amountB,
        uint256 fee,
        uint256 timestamp
    );
    
    event RewardsClaimed(
        address indexed user,
        uint256 indexed poolId,
        uint256 rewardAmount,
        uint256 timestamp
    );
    
    event PoolUpdated(
        uint256 indexed poolId,
        uint256 newBaseAPY,
        uint256 newMaxMultiplier,
        uint256 timestamp
    );
    
    // Funciones principales
    function createPool(
        address tokenA,
        address tokenB,
        uint256 baseAPY,
        uint256 maxMultiplier,
        uint256 feeInitial,
        uint256 feeFinal,
        uint256 vestingWeeks
    ) external returns (uint256 poolId);
    
    function depositLiquidity(
        uint256 poolId,
        uint256 amountA,
        uint256 amountB
    ) external;
    
    function withdrawLiquidity(
        uint256 poolId,
        uint256 liquidityAmount
    ) external;
    
    function claimRewards(uint256 poolId) external;
    
    function calculateRewards(
        address user,
        uint256 poolId
    ) external view returns (RewardCalculation memory);
    
    function calculateDynamicFee(
        address user,
        uint256 poolId
    ) external view returns (uint256);
    
    // Funciones de información
    function getPoolInfo(uint256 poolId) external view returns (PoolInfo memory);
    
    function getUserPoolInfo(
        address user,
        uint256 poolId
    ) external view returns (UserPoolInfo memory);
    
    function getTotalPools() external view returns (uint256);
    
    function getUserActivePoolsCount(address user) external view returns (uint256);
    
    // Funciones administrativas
    function updatePoolAPY(uint256 poolId, uint256 newBaseAPY) external;
    
    function updatePoolMultiplier(uint256 poolId, uint256 newMaxMultiplier) external;
    
    function pausePool(uint256 poolId) external;
    
    function unpausePool(uint256 poolId) external;
    
    function emergencyWithdraw(uint256 poolId) external;
} 