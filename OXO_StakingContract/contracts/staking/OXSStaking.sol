// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IOXSStaking.sol";
import "../modules/UserManagement.sol";
import "../modules/Distribution.sol";
import "../modules/ClaimLogic.sol";
import "../modules/Emergency.sol";
import "../interfaces/IClaimLogic.sol";

/**
 * @title OXSStaking
 * @dev Implementación del sistema de staking OXS con distribución semanal logarítmica
 * Este contrato utiliza una arquitectura modular con componentes independientes
 * y está protegido contra ataques de reentrancia
 */
contract OXSStaking is UserManagement, Distribution, ClaimLogic, Emergency, IOXSStaking {
    // Dirección del token OXS
    IERC20 public oxsToken;
    
    // Constante para optimizar los cálculos
    uint256 public constant DECIMALS = 18;
    
    /**
     * @dev Constructor del contrato optimizado
     * @param _tokenAddress Dirección del contrato OXSToken
     */
    constructor(address _tokenAddress) BaseModule(msg.sender) {
        require(_tokenAddress != address(0), "Direccion de token invalida");
        oxsToken = IERC20(_tokenAddress);
        
        // Inicializamos todos los módulos en un bloque para optimizar gas
        _initializeBase();
        _initializeDistribution();
        _initializeUserManagement();
        _initializeClaimLogic();
        _initializeEmergency();
    }
    
    /**
     * @dev Implementa la función _transferTokens de ClaimLogic y Emergency
     * con enfoque optimizado para gas y protegida contra reentrancia
     */
    function _transferTokens(address from, address to, uint256 amount) internal override(ClaimLogic, Emergency) {
        require(to != address(0), "Transferencia a direccion cero");
        
        if (from == address(this)) {
            require(oxsToken.transfer(to, amount), "Transferencia fallida");
        } else {
            require(oxsToken.transferFrom(from, to, amount), "Transferencia fallida");
        }
    }
    
    /**
     * @dev Implementa la función getBalance de Emergency con enfoque optimizado para gas
     */
    function getBalance(address account) internal view override returns (uint256) {
        return oxsToken.balanceOf(account);
    }
    
    /**
     * @dev Resuelve el conflicto de implementaciones de canClaimTokens 
     * Optimizado para short-circuit
     * @param user Dirección del usuario
     * @param week Número de semana
     * @return true si el usuario puede reclamar tokens
     */
    function canClaimTokens(address user, uint256 week) public view override(ClaimLogic, IClaimLogic) returns (bool) {
        return ClaimLogic.canClaimTokens(user, week);
    }
    
    /**
     * @dev Función para verificar el balance disponible para distribución
     * @return Balance del contrato de staking
     */
    function getStakingBalance() external view returns (uint256) {
        return oxsToken.balanceOf(address(this));
    }
    
    // El resto de funcionalidades se hereda directamente de los módulos
} 