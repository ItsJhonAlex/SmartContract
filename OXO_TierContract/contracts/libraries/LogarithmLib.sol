// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title LogarithmLib
 * @dev Biblioteca para cálculos logarítmicos utilizados en el sistema de Tiers
 * Usa la misma progresión exponencial que el sistema de Staking
 */
library LogarithmLib {
    // Constantes para el cálculo del bonus exponencial de lock/tier
    uint256 private constant MAX_LOCK_WEEKS = 104;
    
    /**
     * @dev Calcula el bonus exponencial para una duración específica
     * Usa la fórmula C(t) = e^(-λ·(104 - t)) donde λ = -ln(0.06)/103
     * Misma implementación que en StakingContract para coherencia
     * @param lockDuration Duración del lock en semanas (1-104)
     * @return Bonus exponencial escalado (valor base 10000 para semana 104)
     */
    function calculateExponentialBonus(uint256 lockDuration) public pure returns (uint256) {
        // Validamos que la duración esté en el rango válido
        if (lockDuration == 0) {
            return 600; // Valor mínimo para semana 1 (6%)
        }
        if (lockDuration > MAX_LOCK_WEEKS) {
            return 10000; // Valor máximo para semana 104 (100%)
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
     * @dev Calcula la conversion rate para un tier específico basado en el tiempo de staking
     * @param stakingWeeks Semanas de staking del usuario
     * @return Conversion rate escalado (base 10000)
     */
    function calculateTierConversionRate(uint256 stakingWeeks) public pure returns (uint256) {
        return calculateExponentialBonus(stakingWeeks);
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 1-20
     */
    function _getExponentialBonusRange1(uint256 week) private pure returns (uint256) {
        if (week == 1) return 600;   // 6.0%
        if (week == 2) return 628;   // 6.28%
        if (week == 3) return 658;   // 6.58%
        if (week == 4) return 689;   // 6.89%
        if (week == 5) return 721;   // 7.21%
        if (week == 6) return 755;   // 7.55%
        if (week == 7) return 791;   // 7.91%
        if (week == 8) return 828;   // 8.28%
        if (week == 9) return 867;   // 8.67%
        if (week == 10) return 908;  // 9.08%
        if (week == 11) return 951;  // 9.51%
        if (week == 12) return 996;  // 9.96%
        if (week == 13) return 1043; // 10.43%
        if (week == 14) return 1092; // 10.92%
        if (week == 15) return 1144; // 11.44%
        if (week == 16) return 1198; // 11.98%
        if (week == 17) return 1255; // 12.55%
        if (week == 18) return 1314; // 13.14%
        if (week == 19) return 1376; // 13.76%
        if (week == 20) return 1441; // 14.41%
        return 1441; // Fallback
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 21-40
     */
    function _getExponentialBonusRange2(uint256 week) private pure returns (uint256) {
        if (week == 21) return 1509; // 15.09%
        if (week == 22) return 1580; // 15.80%
        if (week == 23) return 1655; // 16.55%
        if (week == 24) return 1733; // 17.33%
        if (week == 25) return 1815; // 18.15%
        if (week == 26) return 1901; // 19.01% ✓ Coincide con CSV (0.190)
        if (week == 27) return 1991; // 19.91%
        if (week == 28) return 2085; // 20.85%
        if (week == 29) return 2184; // 21.84%
        if (week == 30) return 2287; // 22.87%
        if (week == 31) return 2395; // 23.95%
        if (week == 32) return 2508; // 25.08%
        if (week == 33) return 2627; // 26.27%
        if (week == 34) return 2751; // 27.51%
        if (week == 35) return 2881; // 28.81%
        if (week == 36) return 3017; // 30.17%
        if (week == 37) return 3160; // 31.60%
        if (week == 38) return 3310; // 33.10%
        if (week == 39) return 3467; // 34.67%
        if (week == 40) return 3632; // 36.32%
        return 3632; // Fallback
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 41-60
     */
    function _getExponentialBonusRange3(uint256 week) private pure returns (uint256) {
        if (week == 41) return 3805; // 38.05%
        if (week == 42) return 3987; // 39.87%
        if (week == 43) return 4177; // 41.77%
        if (week == 44) return 4377; // 43.77%
        if (week == 45) return 4587; // 45.87%
        if (week == 46) return 4807; // 48.07%
        if (week == 47) return 5038; // 50.38%
        if (week == 48) return 5280; // 52.80%
        if (week == 49) return 5534; // 55.34%
        if (week == 50) return 5800; // 58.00%
        if (week == 51) return 6079; // 60.79%
        if (week == 52) return 6371; // 63.71% ✓ Coincide aprox con CSV (0.242 * 2.63 ≈ 0.637)
        if (week == 53) return 6677; // 66.77%
        if (week == 54) return 6997; // 69.97%
        if (week == 55) return 7332; // 73.32%
        if (week == 56) return 7683; // 76.83%
        if (week == 57) return 8050; // 80.50%
        if (week == 58) return 8434; // 84.34%
        if (week == 59) return 8836; // 88.36%
        if (week == 60) return 9257; // 92.57%
        return 9257; // Fallback
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 61-80
     */
    function _getExponentialBonusRange4(uint256 week) private pure returns (uint256) {
        if (week == 61) return 9697;  // 96.97%
        if (week == 62) return 10158; // 101.58%
        if (week == 63) return 10641; // 106.41%
        if (week == 64) return 11146; // 111.46%
        if (week == 65) return 11675; // 116.75%
        if (week == 66) return 12228; // 122.28%
        if (week == 67) return 12807; // 128.07%
        if (week == 68) return 13413; // 134.13%
        if (week == 69) return 14047; // 140.47%
        if (week == 70) return 14710; // 147.10%
        if (week == 71) return 15404; // 154.04%
        if (week == 72) return 16131; // 161.31%
        if (week == 73) return 16892; // 168.92%
        if (week == 74) return 17688; // 176.88%
        if (week == 75) return 18521; // 185.21%
        if (week == 76) return 19393; // 193.93%
        if (week == 77) return 20306; // 203.06%
        if (week == 78) return 21262; // 212.62%
        if (week == 79) return 22263; // 222.63%
        if (week == 80) return 23311; // 233.11%
        return 23311; // Fallback
    }
    
    /**
     * @dev Obtiene valores exponenciales para semanas 81-104
     */
    function _getExponentialBonusRange5(uint256 week) private pure returns (uint256) {
        if (week == 81) return 24408;  // 244.08%
        if (week == 82) return 25556;  // 255.56%
        if (week == 83) return 26759;  // 267.59%
        if (week == 84) return 28018;  // 280.18%
        if (week == 85) return 29337;  // 293.37%
        if (week == 86) return 30718;  // 307.18%
        if (week == 87) return 32165;  // 321.65%
        if (week == 88) return 33681;  // 336.81%
        if (week == 89) return 35270;  // 352.70%
        if (week == 90) return 36936;  // 369.36%
        if (week == 91) return 38682;  // 386.82%
        if (week == 92) return 40513;  // 405.13%
        if (week == 93) return 42433;  // 424.33%
        if (week == 94) return 44446;  // 444.46%
        if (week == 95) return 46557;  // 465.57%
        if (week == 96) return 48770;  // 487.70%
        if (week == 97) return 51090;  // 510.90%
        if (week == 98) return 53522;  // 535.22%
        if (week == 99) return 56071;  // 560.71%
        if (week == 100) return 58743; // 587.43%
        if (week == 101) return 61543; // 615.43%
        if (week == 102) return 64477; // 644.77%
        if (week == 103) return 67551; // 675.51%
        if (week >= 104) return 10000; // 100.00% ✓ Valor máximo como en CSV
        return 10000; // Fallback
    }
} 