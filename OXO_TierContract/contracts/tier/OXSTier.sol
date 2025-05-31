// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IOXSTier.sol";
import "../modules/TierManagement.sol";

/**
 * @title OXSTier
 * @dev Implementación del sistema de Tiers de OXS
 * Este contrato maneja la gestión de Tiers basada en el stake de tokens
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
     * @dev Obtiene la tasa de conversión del Tier actual de un usuario
     * @param user Dirección del usuario
     * @return Tasa de conversión del Tier actual
     */
    function getUserTierConversionRate(address user) external view returns (uint256) {
        uint256 tierId = userTiers[user].currentTier;
        if (tierId == 0) return 0;
        return tiers[tierId].conversionRate;
    }
} 