// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title FeeCalculationLib
 * @dev Biblioteca para cálculos de comisiones en sistemas de vesting
 */
library FeeCalculationLib {
    // Constantes para el cálculo de comisiones
    uint256 private constant INITIAL_FEE_RATE = 30; // X_init = 30% (en base 100)
    uint256 private constant FINAL_FEE_RATE = 2;    // X_fin = 2% (en base 100)
    uint256 private constant MAX_VESTING_WEEKS = 104; // S_max = 104 semanas
    uint256 private constant PERCENTAGE_BASE = 100;   // Base para porcentajes
    
    /**
     * @dev Calcula la comisión para una semana específica en el período de vesting
     * Usa la fórmula: fee(S) = X_init - ((X_init - X_fin) × S / S_max)
     * @param currentWeek Semana actual en el vesting (S)
     * @return Comisión en porcentaje (base 100, ej: 1654 = 16.54%)
     */
    function calculateVestingFee(uint256 currentWeek) public pure returns (uint256) {
        // Validamos que la semana no exceda el máximo
        if (currentWeek >= MAX_VESTING_WEEKS) {
            return FINAL_FEE_RATE * 100; // Retornamos la comisión final escalada
        }
        
        if (currentWeek == 0) {
            return INITIAL_FEE_RATE * 100; // Retornamos la comisión inicial escalada
        }
        
        // Calculamos la diferencia entre comisión inicial y final
        uint256 feeDifference = INITIAL_FEE_RATE - FINAL_FEE_RATE; // 28%
        
        // Calculamos la reducción acumulada: (X_init - X_fin) × S / S_max
        uint256 feeReduction = (feeDifference * currentWeek * 100) / MAX_VESTING_WEEKS;
        
        // Calculamos la comisión actual: X_init - reducción acumulada
        uint256 currentFeeRate = (INITIAL_FEE_RATE * 100) - feeReduction;
        
        return currentFeeRate;
    }
    
    /**
     * @dev Calcula la comisión con parámetros personalizados
     * @param currentWeek Semana actual
     * @param initialFeeRate Comisión inicial (en base 100, ej: 30 = 30%)
     * @param finalFeeRate Comisión final (en base 100, ej: 2 = 2%)
     * @param maxWeeks Número máximo de semanas de vesting
     * @return Comisión en porcentaje escalado (base 10000)
     */
    function calculateCustomVestingFee(
        uint256 currentWeek,
        uint256 initialFeeRate,
        uint256 finalFeeRate,
        uint256 maxWeeks
    ) public pure returns (uint256) {
        require(initialFeeRate >= finalFeeRate, "La comision inicial debe ser >= final");
        require(maxWeeks > 0, "El numero de semanas debe ser mayor a 0");
        
        // Validamos que la semana no exceda el máximo
        if (currentWeek >= maxWeeks) {
            return finalFeeRate * 100;
        }
        
        if (currentWeek == 0) {
            return initialFeeRate * 100;
        }
        
        // Calculamos la diferencia entre comisión inicial y final
        uint256 feeDifference = initialFeeRate - finalFeeRate;
        
        // Calculamos la reducción acumulada
        uint256 feeReduction = (feeDifference * currentWeek * 100) / maxWeeks;
        
        // Calculamos la comisión actual
        uint256 currentFeeRate = (initialFeeRate * 100) - feeReduction;
        
        return currentFeeRate;
    }
} 