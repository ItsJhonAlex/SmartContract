// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/ITierManagement.sol";

/**
 * @title BaseModule
 * @dev Módulo base que contiene las variables compartidas entre todos los módulos
 */
abstract contract BaseModule is Ownable {
    // Constantes compartidas
    uint256 public constant TOKEN_PRICE = 15; // Precio del token en centavos (0.15$)
    uint256 public constant MAX_TIERS = 3; // Número máximo de Tiers (Elevator, Premium Elevator, VIP ELEVATOR)
    
    // Variables de estado compartidas
    mapping(uint256 => ITierManagement.TierInfo) public tiers;
    mapping(address => ITierManagement.UserTierInfo) public userTiers;
    
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
     */
    function _initializeDefaultTiers() private {
        // Tier 1: Elevator
        tiers[1] = ITierManagement.TierInfo({
            name: "Elevator",
            requiredTokens: 2000 * 10**18, // 2000 tokens
            cashValue: 300, // 300$
            conversionRate: 10000000000000, // 0.01
            isActive: true
        });
        
        // Tier 2: Premium Elevator
        tiers[2] = ITierManagement.TierInfo({
            name: "Premium Elevator",
            requiredTokens: 10000 * 10**18, // 10000 tokens
            cashValue: 1500, // 1500$
            conversionRate: 10457249638000, // 0.010457249638
            isActive: true
        });
        
        // Tier 3: VIP ELEVATOR
        tiers[3] = ITierManagement.TierInfo({
            name: "VIP ELEVATOR",
            requiredTokens: 34000 * 10**18, // 34000 tokens
            cashValue: 5100, // 5100$
            conversionRate: 10935406999200, // 0.0109354069992
            isActive: true
        });
        
        // Actualizamos el array de Tiers activos
        for (uint256 i = 1; i <= MAX_TIERS; i++) {
            activeTiers.push(i);
            isTierActive[i] = true;
        }
    }
} 