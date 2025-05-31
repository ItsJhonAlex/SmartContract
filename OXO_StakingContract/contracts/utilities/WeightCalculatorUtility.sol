// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../libraries/LogarithmLib.sol";
import "../libraries/FeeCalculationLib.sol";

/**
 * @title WeightCalculatorUtility
 * @dev Contrato de utilidad para visualizar y comparar cálculos de peso
 * Este contrato es solo para testing y comparación, no forma parte del sistema principal
 */
contract WeightCalculatorUtility {
    
    /**
     * @dev Estructura para comparar resultados de cálculo de peso
     */
    struct WeightComparison {
        uint256 stakedAmount;
        uint256 productivity;
        uint256 lockDuration;
        uint256 oldLinearWeight;
        uint256 newExponentialWeight;
        uint256 improvementFactor; // Factor de mejora (escalado por 10000)
        uint256 exponentialBonus;
        uint256 linearBonus;
    }
    
    /**
     * @dev Calcula el peso usando el método lineal anterior
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad (0-100)
     * @param lockDuration Duración de bloqueo en semanas
     * @return Peso calculado con método lineal
     */
    function calculateLinearWeight(
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration
    ) public pure returns (uint256) {
        // Método anterior: lockBonus = 100 + lockDuration
        uint256 validProductivity = productivity > 100 ? 100 : productivity;
        uint256 validLockDuration = lockDuration > 104 ? 104 : lockDuration;
        
        uint256 lockBonus = 100 + validLockDuration;
        uint256 productivityBonus = 100 + validProductivity;
        
        return (stakedAmount * lockBonus * productivityBonus) / 10000;
    }
    
    /**
     * @dev Calcula el peso usando el nuevo método exponencial
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad (0-100)
     * @param lockDuration Duración de bloqueo en semanas
     * @return Peso calculado con método exponencial
     */
    function calculateExponentialWeight(
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration
    ) public pure returns (uint256) {
        // Nuevo método: lockBonus exponencial
        uint256 validProductivity = productivity > 100 ? 100 : productivity;
        uint256 validLockDuration = lockDuration > 104 ? 104 : lockDuration;
        
        uint256 exponentialLockBonus = LogarithmLib.calculateExponentialLockBonus(validLockDuration);
        uint256 productivityBonus = 100 + validProductivity;
        
        return (stakedAmount * exponentialLockBonus * productivityBonus) / 1000000;
    }
    
    /**
     * @dev Compara ambos métodos de cálculo de peso
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad (0-100)
     * @param lockDuration Duración de bloqueo en semanas
     * @return Estructura con comparación detallada
     */
    function compareWeightCalculations(
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration
    ) public pure returns (WeightComparison memory) {
        uint256 oldWeight = calculateLinearWeight(stakedAmount, productivity, lockDuration);
        uint256 newWeight = calculateExponentialWeight(stakedAmount, productivity, lockDuration);
        
        uint256 validLockDuration = lockDuration > 104 ? 104 : lockDuration;
        uint256 exponentialBonus = LogarithmLib.calculateExponentialLockBonus(validLockDuration);
        uint256 linearBonus = 100 + validLockDuration;
        
        // Calculamos el factor de mejora (newWeight / oldWeight * 10000)
        uint256 improvementFactor = oldWeight > 0 ? (newWeight * 10000) / oldWeight : 0;
        
        return WeightComparison({
            stakedAmount: stakedAmount,
            productivity: productivity,
            lockDuration: lockDuration,
            oldLinearWeight: oldWeight,
            newExponentialWeight: newWeight,
            improvementFactor: improvementFactor,
            exponentialBonus: exponentialBonus,
            linearBonus: linearBonus
        });
    }
    
    /**
     * @dev Genera una tabla de comparación para múltiples duraciones de lock
     * @param stakedAmount Cantidad stakeada fija para la comparación
     * @param productivity Productividad fija para la comparación
     * @param startWeek Semana inicial
     * @param endWeek Semana final
     * @return Array de comparaciones
     */
    function generateComparisonTable(
        uint256 stakedAmount,
        uint256 productivity,
        uint256 startWeek,
        uint256 endWeek
    ) external pure returns (WeightComparison[] memory) {
        require(startWeek <= endWeek && endWeek <= 104, "Rango de semanas invalido");
        
        uint256 tableSize = endWeek - startWeek + 1;
        WeightComparison[] memory comparisons = new WeightComparison[](tableSize);
        
        for (uint256 i = 0; i < tableSize; i++) {
            uint256 currentWeek = startWeek + i;
            comparisons[i] = compareWeightCalculations(stakedAmount, productivity, currentWeek);
        }
        
        return comparisons;
    }
    
    /**
     * @dev Obtiene el bonus exponencial para una duración específica
     * @param lockDuration Duración en semanas
     * @return Bonus exponencial escalado
     */
    function getExponentialBonus(uint256 lockDuration) external pure returns (uint256) {
        return LogarithmLib.calculateExponentialLockBonus(lockDuration);
    }
    
    /**
     * @dev Calcula la comisión de vesting para una semana específica
     * @param currentWeek Semana actual
     * @return Comisión en porcentaje (escalado por 100)
     */
    function calculateVestingFee(uint256 currentWeek) external pure returns (uint256) {
        return FeeCalculationLib.calculateVestingFee(currentWeek);
    }
    
    /**
     * @dev Muestra los valores de bonus exponencial para las primeras 20 semanas
     * @return Array con los primeros 20 valores de bonus
     */
    function showFirst20ExponentialValues() external pure returns (uint256[20] memory) {
        uint256[20] memory values;
        for (uint256 i = 0; i < 20; i++) {
            values[i] = LogarithmLib.calculateExponentialLockBonus(i + 1);
        }
        return values;
    }
    
    /**
     * @dev Muestra los valores de bonus exponencial para las últimas 20 semanas
     * @return Array con los últimos 20 valores de bonus
     */
    function showLast20ExponentialValues() external pure returns (uint256[20] memory) {
        uint256[20] memory values;
        for (uint256 i = 0; i < 20; i++) {
            values[i] = LogarithmLib.calculateExponentialLockBonus(85 + i);
        }
        return values;
    }
} 