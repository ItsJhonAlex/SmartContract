// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title IClaimLogic
 * @dev Interfaz para el módulo de reclamo de tokens
 */
interface IClaimLogic {
    /**
     * @dev Evento emitido cuando un usuario reclama tokens
     */
    event TokensClaimed(address indexed user, uint256 indexed week, uint256 amount, uint256 userWeight);
    
    /**
     * @dev Evento emitido cuando un usuario inicia staking
     */
    event StakingStarted(address indexed user, uint256 week, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando un usuario finaliza staking
     */
    event StakingEnded(address indexed user, uint256 duration, uint256 timestamp);
    
    /**
     * @dev Verifica si un usuario puede reclamar tokens para una semana
     * @param user Dirección del usuario
     * @param week Número de semana
     * @return true si el usuario puede reclamar tokens
     */
    function canClaimTokens(address user, uint256 week) external view returns (bool);
    
    /**
     * @dev Permite a un usuario reclamar tokens para una semana
     * @param week Número de semana
     */
    function claimTokens(uint256 week) external;
    
    /**
     * @dev Permite a un usuario reclamar tokens para múltiples semanas
     * @param weeksToClaim Array de semanas para reclamar
     */
    function claimMultipleWeeks(uint256[] calldata weeksToClaim) external;
    
    /**
     * @dev Finaliza el staking de un usuario
     */
    function endStaking() external;
    
    /**
     * @dev Obtiene los tokens pendientes de reclamar para un usuario
     * @param user Dirección del usuario
     * @return Cantidad de tokens pendientes
     */
    function getPendingTokens(address user) external view returns (uint256);
} 