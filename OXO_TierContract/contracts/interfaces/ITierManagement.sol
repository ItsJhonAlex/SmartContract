// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title ITierManagement
 * @dev Interfaz para el módulo de gestión de Tiers
 */
interface ITierManagement {
    /**
     * @dev Estructura para almacenar información del Tier
     */
    struct TierInfo {
        string name;
        uint256 requiredTokens;
        uint256 cashValue;
        uint256 conversionRate;
        bool isActive;
    }
    
    /**
     * @dev Estructura para almacenar información del usuario
     */
    struct UserTierInfo {
        uint256 currentTier;
        uint256 stakedAmount;
        uint256 lastUpdate;
        bool isActive;
    }
    
    /**
     * @dev Evento emitido cuando se actualiza el Tier de un usuario
     */
    event TierUpdated(address indexed user, uint256 oldTier, uint256 newTier, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando se añade un nuevo Tier
     */
    event TierAdded(uint256 indexed tierId, string name, uint256 requiredTokens, uint256 cashValue, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando se actualiza un Tier existente
     */
    event TierModified(uint256 indexed tierId, string name, uint256 requiredTokens, uint256 cashValue, uint256 timestamp);
    
    /**
     * @dev Añade un nuevo Tier al sistema
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
    ) external;
    
    /**
     * @dev Actualiza un Tier existente
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
    ) external;
    
    /**
     * @dev Actualiza el Tier de un usuario basado en su stake
     * @param user Dirección del usuario
     * @param stakedAmount Cantidad stakeada
     */
    function updateUserTier(address user, uint256 stakedAmount) external;
    
    /**
     * @dev Obtiene información detallada de un Tier
     * @param tierId ID del Tier
     * @return name Nombre del Tier
     * @return requiredTokens Tokens requeridos
     * @return cashValue Valor en efectivo
     * @return conversionRate Tasa de conversión
     * @return isActive Si el Tier está activo
     */
    function getTierInfo(uint256 tierId) external view returns (
        string memory name,
        uint256 requiredTokens,
        uint256 cashValue,
        uint256 conversionRate,
        bool isActive
    );
    
    /**
     * @dev Obtiene información del Tier actual de un usuario
     * @param user Dirección del usuario
     * @return tierId ID del Tier actual
     * @return stakedAmount Cantidad stakeada
     * @return lastUpdate Última actualización
     * @return isActive Si el usuario está activo
     */
    function getUserTierInfo(address user) external view returns (
        uint256 tierId,
        uint256 stakedAmount,
        uint256 lastUpdate,
        bool isActive
    );
    
    /**
     * @dev Calcula el Tier basado en la cantidad stakeada
     * @param stakedAmount Cantidad stakeada
     * @return ID del Tier correspondiente
     */
    function calculateTier(uint256 stakedAmount) external view returns (uint256);
} 