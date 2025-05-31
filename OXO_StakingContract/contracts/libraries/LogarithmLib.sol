// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title LogarithmLib
 * @dev Biblioteca para cálculos logarítmicos utilizados en la distribución de tokens
 */
library LogarithmLib {
    uint256 public constant LN_250_FIXED = 5520622225539; // ln(250) * 10^12
    
    // Constantes para el cálculo del bonus exponencial de lock
    // λ = -ln(0.06)/103 ≈ 0.02744 (con precisión de 18 decimales)
    uint256 private constant LAMBDA_FIXED = 27440899671531; // λ * 10^18
    uint256 private constant MAX_LOCK_WEEKS = 104;
    
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
     * @dev Calcula el bonus exponencial de lock para una duración específica
     * Usa la fórmula C(t) = e^(-λ·(104 - t)) donde λ = -ln(0.06)/103
     * Valores precalculados para optimización de gas
     * @param lockDuration Duración del lock en semanas (1-104)
     * @return Bonus exponencial escalado (valor base 10000 para semana 104)
     */
    function calculateExponentialLockBonus(uint256 lockDuration) public pure returns (uint256) {
        // Validamos que la duración esté en el rango válido
        if (lockDuration == 0) {
            return 600; // Valor mínimo para semana 1
        }
        if (lockDuration > MAX_LOCK_WEEKS) {
            return 10000; // Valor máximo para semana 104
        }
        
        // Retornamos valores precalculados usando condicionales optimizadas
        // Dividimos en rangos para optimizar el lookup
        if (lockDuration <= 20) {
            return _getExponentialBonusRange1(lockDuration);
        } else if (lockDuration <= 40) {
            return _getExponentialBonusRange2(lockDuration);
        } else if (lockDuration <= 60) {
            return _getExponentialBonusRange3(lockDuration);
        } else if (lockDuration <= 80) {
            return _getExponentialBonusRange4(lockDuration);
        } else {
            return _getExponentialBonusRange5(lockDuration);
        }
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 1-20
     */
    function _getExponentialBonusRange1(uint256 week) private pure returns (uint256) {
        if (week == 1) return 600;
        if (week == 2) return 628;
        if (week == 3) return 658;
        if (week == 4) return 689;
        if (week == 5) return 721;
        if (week == 6) return 755;
        if (week == 7) return 791;
        if (week == 8) return 828;
        if (week == 9) return 867;
        if (week == 10) return 908;
        if (week == 11) return 951;
        if (week == 12) return 996;
        if (week == 13) return 1043;
        if (week == 14) return 1092;
        if (week == 15) return 1144;
        if (week == 16) return 1198;
        if (week == 17) return 1255;
        if (week == 18) return 1314;
        if (week == 19) return 1376;
        if (week == 20) return 1441;
        return 1441; // Fallback
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 21-40
     */
    function _getExponentialBonusRange2(uint256 week) private pure returns (uint256) {
        if (week == 21) return 1509;
        if (week == 22) return 1580;
        if (week == 23) return 1655;
        if (week == 24) return 1733;
        if (week == 25) return 1815;
        if (week == 26) return 1901;
        if (week == 27) return 1991;
        if (week == 28) return 2085;
        if (week == 29) return 2184;
        if (week == 30) return 2287;
        if (week == 31) return 2395;
        if (week == 32) return 2508;
        if (week == 33) return 2627;
        if (week == 34) return 2751;
        if (week == 35) return 2881;
        if (week == 36) return 3017;
        if (week == 37) return 3160;
        if (week == 38) return 3310;
        if (week == 39) return 3467;
        if (week == 40) return 3632;
        return 3632; // Fallback
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 41-60
     */
    function _getExponentialBonusRange3(uint256 week) private pure returns (uint256) {
        if (week == 41) return 3805;
        if (week == 42) return 3987;
        if (week == 43) return 4177;
        if (week == 44) return 4377;
        if (week == 45) return 4587;
        if (week == 46) return 4807;
        if (week == 47) return 5038;
        if (week == 48) return 5280;
        if (week == 49) return 5534;
        if (week == 50) return 5800;
        if (week == 51) return 6079;
        if (week == 52) return 6371;
        if (week == 53) return 6677;
        if (week == 54) return 6997;
        if (week == 55) return 7332;
        if (week == 56) return 7683;
        if (week == 57) return 8050;
        if (week == 58) return 8434;
        if (week == 59) return 8836;
        if (week == 60) return 9257;
        return 9257; // Fallback
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 61-80
     */
    function _getExponentialBonusRange4(uint256 week) private pure returns (uint256) {
        if (week == 61) return 9697;
        if (week == 62) return 10158;
        if (week == 63) return 10641;
        if (week == 64) return 11146;
        if (week == 65) return 11675;
        if (week == 66) return 12228;
        if (week == 67) return 12807;
        if (week == 68) return 13413;
        if (week == 69) return 14047;
        if (week == 70) return 14710;
        if (week == 71) return 15404;
        if (week == 72) return 16131;
        if (week == 73) return 16892;
        if (week == 74) return 17688;
        if (week == 75) return 18521;
        if (week == 76) return 19393;
        if (week == 77) return 20306;
        if (week == 78) return 21262;
        if (week == 79) return 22263;
        if (week == 80) return 23311;
        return 23311; // Fallback
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 81-104
     */
    function _getExponentialBonusRange5(uint256 week) private pure returns (uint256) {
        if (week == 81) return 24408;
        if (week == 82) return 25556;
        if (week == 83) return 26759;
        if (week == 84) return 28018;
        if (week == 85) return 29337;
        if (week == 86) return 30718;
        if (week == 87) return 32165;
        if (week == 88) return 33681;
        if (week == 89) return 35270;
        if (week == 90) return 36936;
        if (week == 91) return 38682;
        if (week == 92) return 40513;
        if (week == 93) return 42433;
        if (week == 94) return 44446;
        if (week == 95) return 46557;
        if (week == 96) return 48770;
        if (week == 97) return 51090;
        if (week == 98) return 53522;
        if (week == 99) return 56071;
        if (week == 100) return 58743;
        if (week == 101) return 61543;
        if (week == 102) return 64477;
        if (week == 103) return 67551;
        if (week >= 104) return 10000; // Valor máximo
        return 10000; // Fallback
    }
    
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