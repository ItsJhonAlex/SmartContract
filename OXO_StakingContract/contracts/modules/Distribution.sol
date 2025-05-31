// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IDistribution.sol";
import "../libraries/LogarithmLib.sol";
import "../libraries/DateTimeLib.sol";
import "./BaseModule.sol";
import "./TimeGuard.sol";

/**
 * @title Distribution
 * @dev Implementación del módulo de distribución de tokens
 */
abstract contract Distribution is IDistribution, BaseModule, TimeGuard {
    // Constante precalculada para evitar cálculos repetitivos
    uint256 private constant BASE_DISTRIBUTION = TOTAL_SUPPLY / MAX_WEEKS;
    
    // Identificadores de operación para TimeGuard
    bytes32 private constant DISTRIBUTE_WEEKLY_OPERATION = keccak256("distributeWeeklyTokens");
    bytes32 private constant DISTRIBUTE_MULTIPLE_OPERATION = keccak256("distributeMultipleWeeks");
    
    /**
     * @dev Inicializa el módulo de distribución
     */
    function _initializeDistribution() internal {
        _initializeBase();
    }
    
    /**
     * @dev Calcula la cantidad de tokens a distribuir en una semana específica
     * @param week Número de semana
     * @return Cantidad de tokens a distribuir
     */
    function calculateWeeklyTokens(uint256 week) public view virtual override returns (uint256) {
        // No se puede distribuir más allá de MAX_WEEKS
        require(week < MAX_WEEKS, "Semana excede el limite de distribucion");
        
        // Calculamos el factor de crecimiento
        uint256 growthFactor = LogarithmLib.calculateGrowthFactor(week);
        
        // Calculamos cuántos tokens distribuir esta semana basado en el factor
        uint256 adjustedDistribution = BASE_DISTRIBUTION * growthFactor / 10**18;
        
        // Añadimos validación para asegurar que no distribuimos más tokens de los disponibles
        uint256 remainingTokens = TOTAL_SUPPLY - totalDistributed;
        return Math.min(adjustedDistribution, remainingTokens);
    }
    
    /**
     * @dev Obtiene el número de semana actual basado en el tiempo transcurrido desde el inicio
     * @return Número de semana actual
     */
    function getCurrentWeek() public view virtual override returns (uint256) {
        return DateTimeLib.calculateWeeksSince(startTime);
    }
    
    /**
     * @dev Ejecuta la distribución semanal (solo owner)
     * Protegida contra manipulaciones temporales
     */
    function distributeWeeklyTokens() external virtual override onlyOwner timeLimited(DISTRIBUTE_WEEKLY_OPERATION) {
        uint256 week = getCurrentWeek();
        
        // No podemos distribuir para semanas futuras o ya distribuidas
        require(week < MAX_WEEKS, "Todas las semanas han sido distribuidas");
        require(!weekDistributed[week], "Tokens ya distribuidos para esta semana");
        
        // Calculamos cuántos tokens distribuir esta semana
        uint256 tokensToDistribute = calculateWeeklyTokens(week);
        uint256 timestamp = block.timestamp;
        
        // Actualizamos el estado de forma agrupada para optimizar gas
        _updateDistributionState(week, tokensToDistribute, timestamp);
        
        // Emitimos el evento correspondiente
        emit WeeklyDistribution(week, tokensToDistribute, timestamp);
    }
    
    /**
     * @dev Distribuye tokens para múltiples semanas (solo owner)
     * Protegida contra manipulaciones temporales
     * @param startWeek Semana inicial para distribución
     * @param endWeek Semana final para distribución (inclusive)
     */
    function distributeMultipleWeeks(uint256 startWeek, uint256 endWeek) 
        external 
        virtual 
        override 
        onlyOwner 
        timeLimited(DISTRIBUTE_MULTIPLE_OPERATION) 
    {
        uint256 actualCurrentWeek = getCurrentWeek();
        
        require(endWeek < MAX_WEEKS, unicode"Semana final excede el límite");
        require(startWeek <= endWeek, "Semana inicial debe ser <= semana final");
        require(endWeek <= actualCurrentWeek, "No se pueden distribuir semanas futuras");
        
        // Limitamos el número de semanas para evitar ataques de gas
        require(endWeek - startWeek < 52, "Demasiadas semanas para distribuir a la vez");
        
        uint256 timestamp = block.timestamp;
        uint256 newCurrentWeek = currentWeek;
        
        // Iteramos con incremento directo para mayor eficiencia de gas
        for (uint256 week = startWeek; week <= endWeek;) {
            if (!weekDistributed[week]) {
                uint256 tokensToDistribute = calculateWeeklyTokens(week);
                
                // Actualizamos mapeos y estado
                weeklyDistribution[week] = tokensToDistribute;
                weekDistributed[week] = true;
                totalDistributed += tokensToDistribute;
                
                // Guardamos en el historial
                distributionHistory.push(DistributionInfo({
                    week: week,
                    amount: tokensToDistribute,
                    timestamp: timestamp
                }));
                
                emit WeeklyDistribution(week, tokensToDistribute, timestamp);
            }
            
            // Incremento manual para optimizar gas
            unchecked { ++week; }
            
            // Actualizamos la semana actual si corresponde
            if (week > newCurrentWeek) {
                newCurrentWeek = week;
            }
        }
        
        // Actualizamos la semana actual solo una vez al final
        if (endWeek > currentWeek) {
            currentWeek = newCurrentWeek;
        }
    }
    
    /**
     * @dev Actualiza el estado de distribución para una semana
     * @param week Número de semana
     * @param tokensToDistribute Tokens a distribuir
     * @param timestamp Timestamp de la distribución
     */
    function _updateDistributionState(
        uint256 week, 
        uint256 tokensToDistribute,
        uint256 timestamp
    ) private {
        // Actualizamos el estado
        weeklyDistribution[week] = tokensToDistribute;
        weekDistributed[week] = true;
        totalDistributed += tokensToDistribute;
        
        // No actualizamos currentWeek a un valor futuro, solo al actual
        if (week > currentWeek) {
            currentWeek = week;
        }
        
        // Guardamos en el historial
        distributionHistory.push(DistributionInfo({
            week: week,
            amount: tokensToDistribute,
            timestamp: timestamp
        }));
    }
    
    /**
     * @dev Obtiene el historial completo de distribuciones
     * @return Array con todas las distribuciones
     */
    function getDistributionHistory() external view virtual override returns (DistributionInfo[] memory) {
        return distributionHistory;
    }
} 