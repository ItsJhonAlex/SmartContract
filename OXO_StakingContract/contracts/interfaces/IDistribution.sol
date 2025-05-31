// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title IDistribution
 * @dev Interfaz para el módulo de distribución de tokens
 */
interface IDistribution {
    /**
     * @dev Estructura para almacenar información de distribución
     */
    struct DistributionInfo {
        uint256 week;
        uint256 amount;
        uint256 timestamp;
    }
    
    /**
     * @dev Evento emitido cuando se distribuyen tokens para una semana
     */
    event WeeklyDistribution(uint256 indexed week, uint256 amount, uint256 timestamp);
    
    /**
     * @dev Calcula la cantidad de tokens a distribuir para una semana
     * @param week Número de semana
     * @return Cantidad de tokens a distribuir
     */
    function calculateWeeklyTokens(uint256 week) external view returns (uint256);
    
    /**
     * @dev Obtiene el número de la semana actual
     * @return Número de semana actual
     */
    function getCurrentWeek() external view returns (uint256);
    
    /**
     * @dev Distribuye tokens para la semana actual
     */
    function distributeWeeklyTokens() external;
    
    /**
     * @dev Distribuye tokens para un rango de semanas
     * @param startWeek Semana inicial
     * @param endWeek Semana final
     */
    function distributeMultipleWeeks(uint256 startWeek, uint256 endWeek) external;
    
    /**
     * @dev Obtiene el historial completo de distribuciones
     * @return Array con todas las distribuciones
     */
    function getDistributionHistory() external view returns (DistributionInfo[] memory);
} 