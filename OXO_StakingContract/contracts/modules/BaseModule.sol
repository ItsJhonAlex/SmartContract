// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IDistribution.sol";
import "../interfaces/IUserManagement.sol";

/**
 * @title BaseModule
 * @dev Módulo base que contiene las variables compartidas entre todos los módulos
 */
abstract contract BaseModule is Ownable {
    // Constantes compartidas
    uint256 public constant TOTAL_SUPPLY = 62500000 * 10**18; // 62.5M tokens con 18 decimales
    uint256 public constant MAX_WEEKS = 104; // Número total de semanas de distribución (2 años)
    
    // Variables de estado compartidas
    uint256 public totalDistributed;
    uint256 public startTime;
    uint256 public currentWeek;
    
    // Mapeos compartidos
    mapping(uint256 => uint256) public weeklyDistribution;
    mapping(uint256 => bool) public weekDistributed;
    
    // Variables para gestión de usuario
    uint256 public totalUserWeight;
    mapping(address => bool) public eligibleClaimers;
    mapping(address => IUserManagement.UserInfo) public userInfo;
    mapping(address => mapping(uint256 => bool)) public hasClaimed;
    
    // Historial de distribución
    IDistribution.DistributionInfo[] public distributionHistory;
    
    /**
     * @dev Constructor que inicializa Ownable con el dueño correcto
     * @param initialOwner Dirección del dueño inicial
     */
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Inicializa las variables base
     */
    function _initializeBase() internal {
        startTime = block.timestamp;
        currentWeek = 0;
        totalDistributed = 0;
    }
} 