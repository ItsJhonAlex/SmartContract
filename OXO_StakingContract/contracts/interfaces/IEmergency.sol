// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title IEmergency
 * @dev Interfaz para el módulo de funciones de emergencia
 */
interface IEmergency {
    /**
     * @dev Evento emitido cuando se realiza un retiro de emergencia
     */
    event EmergencyWithdrawal(uint256 amount, address indexed destination, uint256 timestamp);
    
    /**
     * @dev Retira tokens en caso de emergencia
     * @param amount Cantidad de tokens a retirar
     * @param destination Dirección de destino
     */
    function emergencyWithdraw(uint256 amount, address destination) external;
    
    /**
     * @dev Pausa el contrato
     */
    function pause() external;
    
    /**
     * @dev Reanuda el contrato
     */
    function unpause() external;
} 