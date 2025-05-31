// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title YieldMath
 * @dev Biblioteca para cálculos matemáticos del sistema de Yield Farming
 * Implementa las fórmulas de fee con vesting y liquidity mining
 */
library YieldMath {
    
    // Constantes para precisión en cálculos
    uint256 public constant PRECISION = 10000; // Basis points (100% = 10000)
    uint256 public constant SECONDS_PER_WEEK = 7 * 24 * 60 * 60;
    uint256 public constant MAX_PERCENTAGE = 10000; // 100%
    
    /**
     * @dev Calcula el fee dinámico con vesting según la fórmula:
     * fee(S) = X_init - ((X_init - X_fin) × S / S_max)
     * 
     * Ejemplo del cálculo mostrado:
     * - X_init = 30% (3000 basis points)
     * - X_fin = 2% (200 basis points)  
     * - S = 50 semanas
     * - S_max = 104 semanas
     * - Resultado: 16.54% (1654 basis points)
     * 
     * @param feeInitial Fee inicial en basis points (X_init)
     * @param feeFinal Fee final en basis points (X_fin)
     * @param weeksStaked Semanas que ha estado stakeado (S)
     * @param maxVestingWeeks Semanas máximas de vesting (S_max)
     * @return Fee actual en basis points
     */
    function calculateDynamicFee(
        uint256 feeInitial,
        uint256 feeFinal,
        uint256 weeksStaked,
        uint256 maxVestingWeeks
    ) internal pure returns (uint256) {
        // Validaciones
        require(feeInitial >= feeFinal, "Fee inicial debe ser >= fee final");
        require(maxVestingWeeks > 0, "Max vesting weeks debe ser > 0");
        
        // Si ya completó el vesting, retorna fee final
        if (weeksStaked >= maxVestingWeeks) {
            return feeFinal;
        }
        
        // Cálculo: fee(S) = X_init - ((X_init - X_fin) × S / S_max)
        uint256 feeDifference = feeInitial - feeFinal;
        uint256 reduction = (feeDifference * weeksStaked) / maxVestingWeeks;
        
        return feeInitial - reduction;
    }
    
    /**
     * @dev Calcula la recompensa de liquidity mining según la fórmula:
     * Recompensa = (CLP/LTP) × Fees
     * 
     * @param userLiquidity Contribución al pool del usuario (CLP)
     * @param totalLiquidity Liquidez total del pool (LTP)
     * @param totalFees Total de fees a distribuir
     * @return Recompensa proporcional para el usuario
     */
    function calculateLiquidityMiningReward(
        uint256 userLiquidity,
        uint256 totalLiquidity,
        uint256 totalFees
    ) internal pure returns (uint256) {
        require(totalLiquidity > 0, "Total liquidity debe ser > 0");
        
        if (userLiquidity == 0) {
            return 0;
        }
        
        // Recompensa = (CLP/LTP) × Fees
        return (userLiquidity * totalFees) / totalLiquidity;
    }
    
    /**
     * @dev Calcula el APY efectivo con multiplicadores
     * @param baseAPY APY base del pool
     * @param tierMultiplier Multiplicador por tier (1000 = 1.0x)
     * @param timeBonus Bonus exponencial por tiempo
     * @param stakingBonus Bonus adicional por staking (1250 = 1.25x)
     * @return APY efectivo
     */
    function calculateEffectiveAPY(
        uint256 baseAPY,
        uint256 tierMultiplier,
        uint256 timeBonus,
        uint256 stakingBonus
    ) internal pure returns (uint256) {
        // APY efectivo = baseAPY × tierMultiplier × timeBonus × stakingBonus
        uint256 effectiveAPY = baseAPY;
        effectiveAPY = (effectiveAPY * tierMultiplier) / 1000; // 1000 = 1.0x
        effectiveAPY = (effectiveAPY * timeBonus) / 10000;     // 10000 = 100%
        effectiveAPY = (effectiveAPY * stakingBonus) / 1000;   // 1000 = 1.0x
        
        return effectiveAPY;
    }
    
    /**
     * @dev Calcula rewards base por tiempo
     * @param liquidityAmount Cantidad de liquidez del usuario
     * @param effectiveAPY APY efectivo después de multiplicadores
     * @param timeInSeconds Tiempo transcurrido en segundos
     * @return Rewards base calculados
     */
    function calculateBaseRewards(
        uint256 liquidityAmount,
        uint256 effectiveAPY,
        uint256 timeInSeconds
    ) internal pure returns (uint256) {
        if (liquidityAmount == 0 || effectiveAPY == 0 || timeInSeconds == 0) {
            return 0;
        }
        
        // Rewards = (liquidez × APY × tiempo) / (365 days × 100%)
        uint256 secondsPerYear = 365 * 24 * 60 * 60;
        uint256 rewards = (liquidityAmount * effectiveAPY * timeInSeconds) / (secondsPerYear * PRECISION);
        
        return rewards;
    }
    
    /**
     * @dev Convierte tiempo en segundos a semanas
     * @param timeInSeconds Tiempo en segundos
     * @return Número de semanas (redondeado hacia abajo)
     */
    function secondsToWeeks(uint256 timeInSeconds) internal pure returns (uint256) {
        return timeInSeconds / SECONDS_PER_WEEK;
    }
    
    /**
     * @dev Calcula el multiplicador por tier
     * @param userTier Tier del usuario (1, 2, 3)
     * @param maxMultiplier Multiplicador máximo del pool
     * @return Multiplicador aplicable (1000 = 1.0x)
     */
    function calculateTierMultiplier(
        uint256 userTier,
        uint256 maxMultiplier
    ) internal pure returns (uint256) {
        if (userTier == 0) {
            return 1000; // 1.0x para usuarios sin tier
        }
        
        // Escalamiento lineal: Tier 1 = 60%, Tier 2 = 80%, Tier 3 = 100%
        uint256 tierPercentage = 400 + (userTier * 200); // 600, 800, 1000
        uint256 finalMultiplier = (maxMultiplier * tierPercentage) / 1000;
        
        return finalMultiplier;
    }
    
    /**
     * @dev Valida que los parámetros del pool sean correctos
     * @param feeInitial Fee inicial
     * @param feeFinal Fee final  
     * @param vestingWeeks Semanas de vesting
     * @param baseAPY APY base
     * @return true si son válidos
     */
    function validatePoolParameters(
        uint256 feeInitial,
        uint256 feeFinal,
        uint256 vestingWeeks,
        uint256 baseAPY
    ) internal pure returns (bool) {
        return (
            feeInitial >= feeFinal &&
            feeInitial <= MAX_PERCENTAGE &&
            feeFinal <= MAX_PERCENTAGE &&
            vestingWeeks > 0 &&
            vestingWeeks <= 208 && // Máximo 4 años
            baseAPY > 0 &&
            baseAPY <= 50000 // Máximo 500% APY
        );
    }
} 