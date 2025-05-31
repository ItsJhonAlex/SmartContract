// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title TimeGuard
 * @dev Módulo que proporciona protecciones para funciones dependientes del tiempo
 * Ayuda a mitigar riesgos asociados con manipulaciones de timestamp por mineros
 */
abstract contract TimeGuard {
    // Variables de tiempo
    uint256 private constant MIN_TIME_BETWEEN_OPERATIONS = 15 minutes;
    
    // Mapeo para rastrear el último timestamp de operación por usuario o función
    mapping(bytes32 => uint256) private _lastOperationTime;
    
    /**
     * @dev Verifica que haya pasado suficiente tiempo desde la última operación
     * @param operationId Identificador único de la operación (puede ser hash de nombre de función o tipo)
     * @return true si ha pasado suficiente tiempo desde la última operación
     */
    function _hasTimeElapsed(bytes32 operationId) internal view returns (bool) {
        uint256 lastTime = _lastOperationTime[operationId];
        if (lastTime == 0) {
            return true;
        }
        return block.timestamp >= lastTime + MIN_TIME_BETWEEN_OPERATIONS;
    }
    
    /**
     * @dev Registra el tiempo de la operación actual
     * @param operationId Identificador único de la operación
     */
    function _recordOperationTime(bytes32 operationId) internal {
        _lastOperationTime[operationId] = block.timestamp;
    }
    
    /**
     * @dev Modificador que limita la frecuencia de ejecución de una función
     * @param operationId Identificador único de la operación
     */
    modifier timeLimited(bytes32 operationId) {
        require(_hasTimeElapsed(operationId), "TimeGuard: operacion demasiado frecuente");
        _;
        _recordOperationTime(operationId);
    }
    
    /**
     * @dev Modificador para operaciones que necesitan evitar manipulaciones de timestamp
     * Combina la restricción de tiempo con una ventana mínima de operación
     * @param operationId Identificador único de la operación
     */
    modifier timeGuarded(bytes32 operationId) {
        require(_hasTimeElapsed(operationId), "TimeGuard: periodo de seguridad no cumplido");
        
        // Ventana de ejecución mínima - desplaza el riesgo de manipulación
        uint256 startBlock = block.number;
        _;
        require(block.number > startBlock, "TimeGuard: ejecucion en mismo bloque");
        
        _recordOperationTime(operationId);
    }
    
    /**
     * @dev Genera un identificador de operación hash basado en la función y el usuario
     * @param functionName Nombre de la función
     * @param user Dirección del usuario
     * @return Identificador único para la operación
     */
    function _getOperationId(string memory functionName, address user) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(functionName, user));
    }
    
    /**
     * @dev Genera un identificador de operación hash basado solo en la función
     * @param functionName Nombre de la función
     * @return Identificador único para la operación
     */
    function _getFunctionId(string memory functionName) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(functionName));
    }
} 