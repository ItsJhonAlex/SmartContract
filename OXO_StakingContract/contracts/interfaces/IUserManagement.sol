// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title IUserManagement
 * @dev Interfaz para el módulo de gestión de usuarios
 */
interface IUserManagement {
    /**
     * @dev Estructura para almacenar información del usuario
     */
    struct UserInfo {
        bool isEligible;
        uint256 totalClaimed;
        uint256 lastClaimWeek;
        uint256 stakingStart;
        uint256 userWeight;
        uint256 stakedAmount;
        uint256 productivity;
        uint256 lockDuration;
    }
    
    /**
     * @dev Evento emitido cuando se añade un usuario elegible
     */
    event EligibleClaimerAdded(address indexed user, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando se elimina un usuario elegible
     */
    event EligibleClaimerRemoved(address indexed user, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando se actualiza el peso de un usuario
     */
    event UserWeightUpdated(address indexed user, uint256 oldWeight, uint256 newWeight, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando se actualiza la cantidad stakeada de un usuario
     */
    event UserStakeUpdated(address indexed user, uint256 amount, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando se actualiza la productividad de un usuario
     */
    event UserProductivityUpdated(address indexed user, uint256 productivity, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando se actualiza la duración de bloqueo de un usuario
     */
    event UserLockDurationUpdated(address indexed user, uint256 duration, uint256 timestamp);
    
    /**
     * @dev Evento emitido cuando se recalcula el peso total
     */
    event TotalWeightRecalculated(uint256 oldWeight, uint256 newWeight, uint256 timestamp);
    
    /**
     * @dev Calcula el peso de un usuario
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad
     * @param lockDuration Duración de bloqueo
     * @return Peso calculado
     */
    function calculateUserWeight(
        uint256 stakedAmount, 
        uint256 productivity, 
        uint256 lockDuration
    ) external pure returns (uint256);
    
    /**
     * @dev Actualiza las métricas de un usuario
     * @param user Dirección del usuario
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad
     * @param lockDuration Duración de bloqueo
     */
    function updateUserMetrics(
        address user,
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration
    ) external;
    
    /**
     * @dev Añade un usuario elegible
     * @param user Dirección del usuario
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad
     * @param lockDuration Duración de bloqueo
     */
    function addEligibleClaimer(
        address user,
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration
    ) external;
    
    /**
     * @dev Añade múltiples usuarios elegibles
     * @param users Array de direcciones
     * @param stakedAmounts Array de cantidades stakeadas
     * @param productivities Array de productividades
     * @param lockDurations Array de duraciones de bloqueo
     */
    function addMultipleEligibleClaimers(
        address[] calldata users,
        uint256[] calldata stakedAmounts,
        uint256[] calldata productivities,
        uint256[] calldata lockDurations
    ) external;
    
    /**
     * @dev Elimina un usuario elegible
     * @param user Dirección del usuario
     */
    function removeEligibleClaimer(address user) external;
    
    /**
     * @dev Recalcula el peso total de todos los usuarios
     */
    function recalculateTotalUserWeight() external;
    
    /**
     * @dev Obtiene el número total de usuarios elegibles
     * @return Número de usuarios elegibles
     */
    function getTotalEligibleClaimers() external view returns (uint256);
    
    /**
     * @dev Obtiene información detallada de un usuario
     * @param user Dirección del usuario
     * @return isEligible Si el usuario es elegible
     * @return totalClaimed Total reclamado por el usuario
     * @return lastClaimWeek Última semana reclamada
     * @return stakingStart Inicio del staking
     * @return userWeight Peso del usuario
     * @return stakedAmount Cantidad stakeada
     * @return productivity Productividad del usuario
     * @return lockDuration Duración del bloqueo
     * @return pendingClaims Reclamos pendientes
     */
    function getUserDetails(address user) external view returns (
        bool isEligible,
        uint256 totalClaimed,
        uint256 lastClaimWeek,
        uint256 stakingStart,
        uint256 userWeight,
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration,
        uint256 pendingClaims
    );
} 