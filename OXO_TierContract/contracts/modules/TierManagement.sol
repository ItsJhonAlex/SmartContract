// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/ITierManagement.sol";
import "./BaseModule.sol";

/**
 * @title TierManagement
 * @dev Implementación del módulo de gestión de Tiers
 */
abstract contract TierManagement is ITierManagement, BaseModule {
    /**
     * @dev Inicializa el módulo de gestión de Tiers
     */
    function _initializeTierManagement() internal {
        _initializeBase();
    }
    
    /**
     * @dev Añade un nuevo Tier al sistema (solo owner)
     * @param name Nombre del Tier
     * @param requiredTokens Cantidad de tokens requeridos
     * @param cashValue Valor en efectivo
     * @param conversionRate Tasa de conversión
     */
    function addTier(
        string calldata name,
        uint256 requiredTokens,
        uint256 cashValue,
        uint256 conversionRate
    ) external override onlyOwner {
        uint256 newTierId = activeTiers.length + 1;
        require(newTierId <= MAX_TIERS, "Maximo numero de Tiers alcanzado");
        
        tiers[newTierId] = TierInfo({
            name: name,
            requiredTokens: requiredTokens,
            cashValue: cashValue,
            conversionRate: conversionRate,
            isActive: true
        });
        
        activeTiers.push(newTierId);
        isTierActive[newTierId] = true;
        
        emit TierAdded(newTierId, name, requiredTokens, cashValue, block.timestamp);
    }
    
    /**
     * @dev Actualiza un Tier existente (solo owner)
     * @param tierId ID del Tier a actualizar
     * @param name Nuevo nombre
     * @param requiredTokens Nueva cantidad de tokens requeridos
     * @param cashValue Nuevo valor en efectivo
     * @param conversionRate Nueva tasa de conversión
     */
    function updateTier(
        uint256 tierId,
        string calldata name,
        uint256 requiredTokens,
        uint256 cashValue,
        uint256 conversionRate
    ) external override onlyOwner {
        require(tierId > 0 && tierId <= MAX_TIERS, "Tier invalido");
        require(isTierActive[tierId], "Tier no activo");
        
        tiers[tierId] = TierInfo({
            name: name,
            requiredTokens: requiredTokens,
            cashValue: cashValue,
            conversionRate: conversionRate,
            isActive: true
        });
        
        emit TierModified(tierId, name, requiredTokens, cashValue, block.timestamp);
    }
    
    /**
     * @dev Actualiza el Tier de un usuario basado en su stake
     * @param user Dirección del usuario
     * @param stakedAmount Cantidad stakeada
     */
    function updateUserTier(address user, uint256 stakedAmount) external override {
        require(user != address(0), "Direccion invalida");
        
        UserTierInfo storage userInfo = userTiers[user];
        uint256 oldTier = userInfo.currentTier;
        uint256 newTier = calculateTier(stakedAmount);
        
        if (oldTier != newTier) {
            userInfo.currentTier = newTier;
            userInfo.stakedAmount = stakedAmount;
            userInfo.lastUpdate = block.timestamp;
            userInfo.isActive = true;
            
            emit TierUpdated(user, oldTier, newTier, block.timestamp);
        }
    }
    
    /**
     * @dev Obtiene información detallada de un Tier
     * @param tierId ID del Tier
     * @return name Nombre del Tier
     * @return requiredTokens Tokens requeridos
     * @return cashValue Valor en efectivo
     * @return conversionRate Tasa de conversión
     * @return isActive Si el Tier está activo
     */
    function getTierInfo(uint256 tierId) external view override returns (
        string memory name,
        uint256 requiredTokens,
        uint256 cashValue,
        uint256 conversionRate,
        bool isActive
    ) {
        require(tierId > 0 && tierId <= MAX_TIERS, "Tier invalido");
        TierInfo storage tier = tiers[tierId];
        
        return (
            tier.name,
            tier.requiredTokens,
            tier.cashValue,
            tier.conversionRate,
            tier.isActive
        );
    }
    
    /**
     * @dev Obtiene información del Tier actual de un usuario
     * @param user Dirección del usuario
     * @return tierId ID del Tier actual
     * @return stakedAmount Cantidad stakeada
     * @return lastUpdate Última actualización
     * @return isActive Si el usuario está activo
     */
    function getUserTierInfo(address user) external view override returns (
        uint256 tierId,
        uint256 stakedAmount,
        uint256 lastUpdate,
        bool isActive
    ) {
        UserTierInfo storage userInfo = userTiers[user];
        
        return (
            userInfo.currentTier,
            userInfo.stakedAmount,
            userInfo.lastUpdate,
            userInfo.isActive
        );
    }
    
    /**
     * @dev Calcula el Tier basado en la cantidad stakeada
     * @param stakedAmount Cantidad stakeada
     * @return ID del Tier correspondiente
     */
    function calculateTier(uint256 stakedAmount) public view override returns (uint256) {
        if (stakedAmount == 0) return 0;
        
        // Iteramos desde el Tier más alto al más bajo para encontrar el primero que cumpla
        for (uint256 i = MAX_TIERS; i > 0; i--) {
            if (stakedAmount >= tiers[i].requiredTokens && tiers[i].isActive) {
                return i;
            }
        }
        
        return 0; // No califica para ningún Tier
    }
} 