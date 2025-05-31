// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/**
 * @title Migrations
 * @dev Contrato requerido por Truffle para gestionar migraciones
 */
contract Migrations {
    address public owner = msg.sender;
    uint public last_completed_migration;

    modifier restricted() {
        require(
            msg.sender == owner,
            "Esta funcion esta restringida al owner del contrato"
        );
        _;
    }

    function setCompleted(uint completed) public restricted {
        last_completed_migration = completed;
    }
} 