// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title DateTimeLib
 * @dev Biblioteca para cálculos de fechas y tiempo
 */
library DateTimeLib {
    uint256 public constant SECONDS_PER_WEEK = 604800; // 7 * 24 * 60 * 60
    
    /**
     * @dev Calcula el número de semanas transcurridas desde una fecha de inicio
     * @param startTime Timestamp de inicio
     * @return Número de semanas transcurridas
     */
    function calculateWeeksSince(uint256 startTime) public view returns (uint256) {
        // Si el tiempo actual es menor que el inicio, no han pasado semanas
        if (block.timestamp <= startTime) {
            return 0;
        }
        
        // Podemos usar unchecked porque ya verificamos que block.timestamp > startTime
        unchecked {
            return (block.timestamp - startTime) / SECONDS_PER_WEEK;
        }
    }
} 