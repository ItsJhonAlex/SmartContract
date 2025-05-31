// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title LogarithmLib
 * @dev Biblioteca para cálculos logarítmicos utilizados en la distribución de tokens
 */
library LogarithmLib {
    uint256 public constant LN_250_FIXED = 5520622225539; // ln(250) * 10^12
    
    // Valores precalculados para rangos comunes (optimizados para 104 semanas)
    uint256 private constant RANGE1_SLOPE = 220000000000; // Por debajo de 10
    uint256 private constant RANGE2_BASE = 800000000000;  // Base para rango 10-30
    uint256 private constant RANGE2_SLOPE = 100000000000; // Pendiente para rango 10-30
    uint256 private constant RANGE3_BASE = 1100000000000; // Base para rango 30-50
    uint256 private constant RANGE3_SLOPE = 50000000000;  // Pendiente para rango 30-50
    uint256 private constant RANGE4_BASE = 1300000000000; // Base para rango 50-70
    uint256 private constant RANGE4_SLOPE = 30000000000;  // Pendiente para rango 50-70
    uint256 private constant RANGE5_BASE = 1500000000000; // Base para rango 70-90
    uint256 private constant RANGE5_SLOPE = 20000000000;  // Pendiente para rango 70-90
    uint256 private constant RANGE6_BASE = 1700000000000; // Base para rango 90-104
    uint256 private constant RANGE6_SLOPE = 10000000000;  // Pendiente para rango 90-104
    
    /**
     * @dev Calcula el factor de crecimiento para una semana específica
     * @param week Número de semana para la que se calcula el factor
     * @return Factor de crecimiento según fórmula logarítmica (formato fixed point)
     */
    function calculateGrowthFactor(uint256 week) public pure returns (uint256) {
        // Calculamos ln(week+5) * 10^12 usando aproximación
        uint256 input;
        unchecked { input = week + 5; }
        
        // Simulación básica para el rango de 5 a 109 (week+5) optimizada
        uint256 lnResult;
        
        // Usamos if-else en cascada para optimizar el consumo de gas
        if (input <= 10) {
            unchecked { lnResult = input * RANGE1_SLOPE; }
        } else if (input <= 35) {
            unchecked { lnResult = RANGE2_BASE + (input - 10) * RANGE2_SLOPE; }
        } else if (input <= 55) {
            unchecked { lnResult = RANGE3_BASE + (input - 35) * RANGE3_SLOPE; }
        } else if (input <= 75) {
            unchecked { lnResult = RANGE4_BASE + (input - 55) * RANGE4_SLOPE; }
        } else if (input <= 95) {
            unchecked { lnResult = RANGE5_BASE + (input - 75) * RANGE5_SLOPE; }
        } else {
            unchecked { lnResult = RANGE6_BASE + (input - 95) * RANGE6_SLOPE; }
        }
        
        // División como operación final para mantener la precisión
        // LN(semana+5)/LN(250) * 10^18
        unchecked { return (lnResult * 10**18) / LN_250_FIXED; }
    }
} 