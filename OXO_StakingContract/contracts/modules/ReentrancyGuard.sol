// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title ReentrancyGuard
 * @dev Módulo de protección contra ataques de reentrancia.
 * Inspirado en la implementación de OpenZeppelin, adaptado al sistema OXO.
 */
abstract contract ReentrancyGuard {
    // Posibles estados durante la ejecución de una función protegida
    // El valor inicial del slot es 1 y no 0 para ahorrar gas
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    // Variable de estado para rastrear si una función está siendo ejecutada
    uint256 private _status;

    /**
     * @dev Constructor que inicializa el estado de reentrancia
     */
    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Modificador que protege una función contra reentrancia.
     * Si se intenta reentrar en una función protegida, la transacción revertirá.
     */
    modifier nonReentrant() {
        // Se requiere que el estado actual no sea de ejecución
        require(_status != _ENTERED, "ReentrancyGuard: reentrada detectada");

        // Marcamos que estamos ejecutando la función
        _status = _ENTERED;

        // Ejecutamos la función
        _;

        // Restablecemos el estado al salir de la función
        _status = _NOT_ENTERED;
    }
    
    /**
     * @dev Función para verificar el estado actual (para pruebas)
     * @return true si no hay funciones protegidas en ejecución
     */
    function _notEntered() internal view returns (bool) {
        return _status == _NOT_ENTERED;
    }
} 