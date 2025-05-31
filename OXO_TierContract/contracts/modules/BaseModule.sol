// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ITierManagement.sol";
import "../libraries/LogarithmLib.sol";

/**
 * @title BaseModule
 * @dev Módulo base que contiene las variables compartidas entre todos los módulos
 * Integrado con la progresión exponencial del sistema de Staking
 */
abstract contract BaseModule is Ownable {
    // Constantes compartidas
    uint256 public constant TOKEN_PRICE = 15; // Precio del token en centavos (0.15$)
    uint256 public constant MAX_TIERS = 3; // Número máximo de Tiers (Elevator, Premium Elevator, VIP ELEVATOR)
    
    // Variables de estado compartidas
    mapping(uint256 => ITierManagement.TierInfo) public tiers;
    mapping(address => ITierManagement.UserTierInfo) public userTiers;
    mapping(address => uint256) public userStakingStart; // Tiempo de inicio de staking por usuario
    
    // Array para rastrear Tiers activos
    uint256[] public activeTiers;
    mapping(uint256 => bool) public isTierActive;
    
    /**
     * @dev Constructor que inicializa Ownable con el dueño correcto
     * @param initialOwner Dirección del dueño inicial
     */
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Inicializa las variables base
     */
    function _initializeBase() internal {
        // Inicialización de Tiers por defecto según Tiers.csv
        _initializeDefaultTiers();
    }
    
    /**
     * @dev Inicializa los Tiers por defecto según Tiers.csv
     * Ahora usa conversion rates dinámicas basadas en progresión exponencial
     */
    function _initializeDefaultTiers() private {
        // Tier 1: Elevator
        tiers[1] = ITierManagement.TierInfo({
            name: "Elevator",
            requiredTokens: 2000 * 10**18, // 2000 tokens
            cashValue: 300, // 300$
            conversionRate: 600, // Valor inicial (6%), se actualiza dinámicamente
            isActive: true
        });
        
        // Tier 2: Premium Elevator
        tiers[2] = ITierManagement.TierInfo({
            name: "Premium Elevator",
            requiredTokens: 10000 * 10**18, // 10000 tokens
            cashValue: 1500, // 1500$
            conversionRate: 600, // Valor inicial (6%), se actualiza dinámicamente
            isActive: true
        });
        
        // Tier 3: VIP ELEVATOR
        tiers[3] = ITierManagement.TierInfo({
            name: "VIP ELEVATOR",
            requiredTokens: 34000 * 10**18, // 34000 tokens
            cashValue: 5100, // 5100$
            conversionRate: 600, // Valor inicial (6%), se actualiza dinámicamente
            isActive: true
        });
        
        // Actualizamos el array de Tiers activos
        for (uint256 i = 1; i <= MAX_TIERS; i++) {
            activeTiers.push(i);
            isTierActive[i] = true;
        }
    }
    
    /**
     * @dev Calcula la conversion rate dinámica para un usuario basada en su tiempo de staking
     * Usa la misma progresión exponencial que el sistema de Staking
     * @param user Dirección del usuario
     * @return Conversion rate actual basada en semanas de staking
     */
    function getUserDynamicConversionRate(address user) public view returns (uint256) {
        uint256 stakingStartTime = userStakingStart[user];
        if (stakingStartTime == 0) {
            return 600; // Valor mínimo si no ha empezado staking
        }
        
        // Calculamos las semanas transcurridas desde el inicio del staking
        uint256 stakingWeeks = (block.timestamp - stakingStartTime) / (7 * 24 * 60 * 60);
        
        // Retornamos la conversion rate basada en la progresión exponencial
        return LogarithmLib.calculateTierConversionRate(stakingWeeks);
    }
    
    /**
     * @dev Actualiza el tiempo de inicio de staking para un usuario
     * Esta función debe ser llamada cuando el usuario empiece a hacer staking
     * @param user Dirección del usuario
     */
    function setUserStakingStart(address user) external onlyOwner {
        userStakingStart[user] = block.timestamp;
    }
    
    /**
     * @dev Obtiene las semanas de staking de un usuario
     * @param user Dirección del usuario
     * @return Número de semanas que ha estado haciendo staking
     */
    function getUserStakingWeeks(address user) public view returns (uint256) {
        uint256 stakingStartTime = userStakingStart[user];
        if (stakingStartTime == 0) {
            return 0;
        }
        return (block.timestamp - stakingStartTime) / (7 * 24 * 60 * 60);
    }
} 