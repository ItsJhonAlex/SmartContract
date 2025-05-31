// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/IEmergency.sol";
import "./BaseModule.sol";
import "./ReentrancyGuard.sol";

/**
 * @title Emergency
 * @dev Implementación del módulo de funciones de emergencia
 */
abstract contract Emergency is IEmergency, Pausable, BaseModule, ReentrancyGuard {
    /**
     * @dev Inicializa el módulo de emergencia
     */
    function _initializeEmergency() internal {
        // No hay inicialización específica adicional
    }
    
    /**
     * @dev Retira tokens en caso de emergencia (solo owner)
     * @param amount Cantidad de tokens a retirar
     * @param destination Dirección de destino
     */
    function emergencyWithdraw(uint256 amount, address destination) external virtual override onlyOwner nonReentrant {
        require(destination != address(0), "Destino invalido");
        
        // Obtenemos el balance una sola vez para ahorrar gas
        uint256 contractBalance = getBalance(address(this));
        require(amount <= contractBalance, "Fondos insuficientes");
        
        // Transferimos los tokens
        _transferTokens(address(this), destination, amount);
        
        // Emitimos el evento con timestamp cacheado
        emit EmergencyWithdrawal(amount, destination, block.timestamp);
    }
    
    /**
     * @dev Pausa todas las transferencias de tokens (solo owner)
     */
    function pause() external virtual override onlyOwner {
        _pause();
    }
    
    /**
     * @dev Reanuda todas las transferencias de tokens (solo owner)
     */
    function unpause() external virtual override onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Obtiene el balance de tokens de una dirección
     * Debe ser implementada por el contrato que hereda
     */
    function getBalance(address account) internal virtual view returns (uint256);
    
    /**
     * @dev Función para transferir tokens entre cuentas
     * Debe ser implementada por el contrato que hereda
     */
    function _transferTokens(address from, address to, uint256 amount) internal virtual;
} 