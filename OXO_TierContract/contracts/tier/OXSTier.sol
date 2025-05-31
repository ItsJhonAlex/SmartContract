// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IOXSTier.sol";
import "../modules/TierManagement.sol";
import "../libraries/LogarithmLib.sol";

/**
 * @title OXSTier
 * @dev Implementación del sistema de Tiers de OXS
 * Este contrato maneja la gestión de Tiers basada en el stake de tokens
 * Integrado con progresión exponencial basada en tiempo de staking
 */
contract OXSTier is IOXSTier, TierManagement {
    // Dirección del token OXS
    IERC20 public oxsToken;
    
    // Constante para optimizar los cálculos
    uint256 public constant DECIMALS = 18;
    
    /**
     * @dev Constructor del contrato
     * @param _tokenAddress Dirección del contrato OXSToken
     */
    constructor(address _tokenAddress) BaseModule(msg.sender) {
        require(_tokenAddress != address(0), "Direccion de token invalida");
        oxsToken = IERC20(_tokenAddress);
        
        // Inicializamos el módulo de gestión de Tiers
        _initializeTierManagement();
    }
    
    /**
     * @dev Verifica el balance de tokens de un usuario
     * @param user Dirección del usuario
     * @return Balance de tokens
     */
    function getTokenBalance(address user) external view returns (uint256) {
        return oxsToken.balanceOf(user);
    }
    
    /**
     * @dev Verifica el balance de tokens stakeados de un usuario
     * @param user Dirección del usuario
     * @return Balance de tokens stakeados
     */
    function getStakedBalance(address user) external view returns (uint256) {
        return userTiers[user].stakedAmount;
    }
    
    /**
     * @dev Verifica si un usuario califica para un Tier específico
     * @param user Dirección del usuario
     * @param tierId ID del Tier a verificar
     * @return true si el usuario califica para el Tier
     */
    function qualifiesForTier(address user, uint256 tierId) external view returns (bool) {
        require(tierId > 0 && tierId <= MAX_TIERS, "Tier invalido");
        return userTiers[user].stakedAmount >= tiers[tierId].requiredTokens;
    }
    
    /**
     * @dev Obtiene el valor en efectivo del Tier actual de un usuario
     * @param user Dirección del usuario
     * @return Valor en efectivo del Tier actual
     */
    function getUserTierCashValue(address user) external view returns (uint256) {
        uint256 tierId = userTiers[user].currentTier;
        if (tierId == 0) return 0;
        return tiers[tierId].cashValue;
    }
    
    /**
     * @dev Obtiene la tasa de conversión INICIAL del Tier actual de un usuario
     * @param user Dirección del usuario
     * @return Tasa de conversión inicial del Tier actual
     */
    function getUserTierConversionRate(address user) external view returns (uint256) {
        uint256 tierId = userTiers[user].currentTier;
        if (tierId == 0) return 0;
        return tiers[tierId].conversionRate;
    }
    
    /**
     * @dev Obtiene la tasa de conversión DINÁMICA del usuario basada en tiempo de staking
     * Esta función usa la progresión exponencial según el tiempo de staking
     * @param user Dirección del usuario
     * @return Tasa de conversión dinámica basada en tiempo de staking
     */
    function getUserDynamicTierConversionRate(address user) external view returns (uint256) {
        uint256 tierId = userTiers[user].currentTier;
        if (tierId == 0) return 0;
        
        // Retornamos la conversion rate dinámica basada en tiempo de staking
        return getUserDynamicConversionRate(user);
    }
    
    /**
     * @dev Obtiene información completa del Tier de un usuario
     * @param user Dirección del usuario
     * @return tierName Nombre del Tier actual
     * @return tierId ID del Tier actual
     * @return stakedAmount Cantidad stakeada
     * @return cashValue Valor en efectivo del Tier
     * @return baseConversionRate Conversion rate base del Tier
     * @return dynamicConversionRate Conversion rate dinámica basada en staking time
     * @return stakingWeeks Semanas de staking
     * @return isActive Si el usuario está activo
     */
    function getUserTierCompleteInfo(address user) external view returns (
        string memory tierName,
        uint256 tierId,
        uint256 stakedAmount,
        uint256 cashValue,
        uint256 baseConversionRate,
        uint256 dynamicConversionRate,
        uint256 stakingWeeks,
        bool isActive
    ) {
        // Optimización: reducir variables locales para evitar "Stack too deep"
        tierId = userTiers[user].currentTier;
        
        if (tierId == 0) {
            return ("No Tier", 0, 0, 0, 0, 0, 0, false);
        }
        
        // Acceso directo sin variable storage local
        return (
            tiers[tierId].name,
            tierId,
            userTiers[user].stakedAmount,
            tiers[tierId].cashValue,
            tiers[tierId].conversionRate,
            getUserDynamicConversionRate(user),
            getUserStakingWeeks(user),
            userTiers[user].isActive
        );
    }
    
    /**
     * @dev Simula la conversion rate para un número específico de semanas
     * Útil para mostrar al usuario cómo mejorará su conversion rate con el tiempo
     * @param numberOfWeeks Número de semanas a simular
     * @return Conversion rate para ese número de semanas
     */
    function simulateConversionRateForWeeks(uint256 numberOfWeeks) external pure returns (uint256) {
        return LogarithmLib.calculateTierConversionRate(numberOfWeeks);
    }
    
    /**
     * @dev Obtiene una tabla de progression de conversion rates para visualización
     * @param startWeek Semana inicial
     * @param endWeek Semana final (máximo startWeek + 50)
     * @return Array de conversion rates para cada semana en el rango
     */
    function getConversionRateProgression(uint256 startWeek, uint256 endWeek) 
        external 
        pure 
        returns (uint256[] memory) 
    {
        require(startWeek <= endWeek, "Semana inicial debe ser <= final");
        require(endWeek <= 104, "Semana final no puede exceder 104");
        require(endWeek - startWeek <= 50, "Rango demasiado grande, maximo 50 semanas");
        
        uint256 length = endWeek - startWeek + 1;
        uint256[] memory progression = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            progression[i] = LogarithmLib.calculateTierConversionRate(startWeek + i);
        }
        
        return progression;
    }
} 