// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "./IUserManagement.sol";
import "./IDistribution.sol";
import "./IClaimLogic.sol";
import "./IEmergency.sol";

/**
 * @title IOXSStaking
 * @dev Interfaz principal para el sistema de staking de OXS, que extiende todas las interfaces de módulos
 */
interface IOXSStaking is IUserManagement, IDistribution, IClaimLogic, IEmergency {
    // Esta interfaz hereda todas las funciones y eventos de los módulos
} 