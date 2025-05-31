// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IUserManagement.sol";
import "./BaseModule.sol";

/**
 * @title UserManagement
 * @dev Implementación del módulo de gestión de usuarios
 */
abstract contract UserManagement is IUserManagement, BaseModule {
    // Constantes
    uint256 public constant MAX_STAKING_WEEKS = 104; // Número máximo de semanas de staking
    
    // Variables de estado
    uint256 public totalEligibleClaimers;
    
    // Array para rastrear cuentas con peso
    address[] public accountsWithWeight;
    mapping(address => bool) public isInAccountsWithWeight;
    
    /**
     * @dev Inicializa el módulo de gestión de usuarios
     */
    function _initializeUserManagement() internal {
        // No hay inicialización específica adicional
    }
    
    /**
     * @dev Calcula el peso de un usuario basado en sus métricas
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad
     * @param lockDuration Duración de bloqueo
     * @return Peso calculado
     */
    function calculateUserWeight(
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration
    ) public pure virtual override returns (uint256) {
        // Aseguramos que la productividad esté en rango 0-100
        uint256 validProductivity = productivity > 100 ? 100 : productivity;
        
        // Aseguramos que la duración del lock no exceda el máximo
        uint256 validLockDuration = Math.min(lockDuration, MAX_STAKING_WEEKS);
        
        // Fórmula para calcular el peso:
        // (stakedAmount * (100 + lockDuration) * (100 + productivity)) / 10000
        unchecked {
            uint256 lockBonus = 100 + validLockDuration;
            uint256 productivityBonus = 100 + validProductivity;
            
            return (stakedAmount * lockBonus * productivityBonus) / 10000;
        }
    }
    
    /**
     * @dev Actualiza las métricas de un usuario
     * @param user Dirección del usuario
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad
     * @param lockDuration Duración de bloqueo
     */
    function updateUserMetrics(
        address user,
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration
    ) public virtual override {
        require(msg.sender == owner() || msg.sender == user, "No autorizado");
        require(eligibleClaimers[user], "El usuario no es elegible");
        
        UserInfo storage info = userInfo[user];
        
        // Guardamos el peso anterior para el evento
        uint256 oldWeight = info.userWeight;
        uint256 currentTimestamp = block.timestamp;
        
        // Actualizamos los datos del usuario
        info.stakedAmount = stakedAmount;
        info.productivity = productivity;
        info.lockDuration = lockDuration;
        
        // Actualizamos el peso del usuario
        uint256 newWeight = calculateUserWeight(stakedAmount, productivity, lockDuration);
        info.userWeight = newWeight;
        
        // Actualizamos el peso total sumando la diferencia
        if (newWeight > oldWeight) {
            unchecked {
                totalUserWeight += (newWeight - oldWeight);
            }
        } else if (oldWeight > newWeight) {
            unchecked {
                totalUserWeight -= (oldWeight - newWeight);
            }
        }
        
        // Emitimos un único evento con todas las actualizaciones para ahorrar gas
        emit UserWeightUpdated(user, oldWeight, newWeight, currentTimestamp);
        emit UserStakeUpdated(user, stakedAmount, currentTimestamp);
        emit UserProductivityUpdated(user, productivity, currentTimestamp);
        emit UserLockDurationUpdated(user, lockDuration, currentTimestamp);
    }
    
    /**
     * @dev Añade un usuario elegible
     * @param user Dirección del usuario
     * @param stakedAmount Cantidad stakeada
     * @param productivity Productividad
     * @param lockDuration Duración de bloqueo
     */
    function addEligibleClaimer(
        address user,
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration
    ) external virtual override onlyOwner {
        require(user != address(0), "Direccion invalida");
        
        if (!eligibleClaimers[user]) {
            eligibleClaimers[user] = true;
            unchecked { totalEligibleClaimers++; }
            userInfo[user].isEligible = true;
            
            // Añadimos al array de cuentas con peso
            if (!isInAccountsWithWeight[user]) {
                accountsWithWeight.push(user);
                isInAccountsWithWeight[user] = true;
            }
            
            emit EligibleClaimerAdded(user, block.timestamp);
        }
        
        // Inicializamos o actualizamos las métricas del usuario
        updateUserMetrics(user, stakedAmount, productivity, lockDuration);
    }
    
    /**
     * @dev Añade múltiples usuarios elegibles
     * @param users Array de direcciones
     * @param stakedAmounts Array de cantidades stakeadas
     * @param productivities Array de productividades
     * @param lockDurations Array de duraciones de bloqueo
     */
    function addMultipleEligibleClaimers(
        address[] calldata users,
        uint256[] calldata stakedAmounts,
        uint256[] calldata productivities,
        uint256[] calldata lockDurations
    ) external virtual override onlyOwner {
        uint256 usersLength = users.length;
        require(
            usersLength == stakedAmounts.length &&
            usersLength == productivities.length &&
            usersLength == lockDurations.length,
            "Arrays de longitud no coincidente"
        );
        
        uint256 currentTimestamp = block.timestamp;
        
        for (uint256 i = 0; i < usersLength;) {
            address user = users[i];
            
            if (user != address(0)) {
                if (!eligibleClaimers[user]) {
                    eligibleClaimers[user] = true;
                    unchecked { totalEligibleClaimers++; }
                    userInfo[user].isEligible = true;
                    
                    // Añadimos al array de cuentas con peso
                    if (!isInAccountsWithWeight[user]) {
                        accountsWithWeight.push(user);
                        isInAccountsWithWeight[user] = true;
                    }
                    
                    emit EligibleClaimerAdded(user, currentTimestamp);
                }
                
                // Actualizamos las métricas del usuario con parámetros del correspondiente índice
                _updateUserMetricsInternal(
                    user, 
                    stakedAmounts[i], 
                    productivities[i], 
                    lockDurations[i],
                    currentTimestamp
                );
            }
            
            unchecked { ++i; }
        }
    }
    
    /**
     * @dev Versión interna de updateUserMetrics que permite optimizar gas para operaciones por lotes
     */
    function _updateUserMetricsInternal(
        address user,
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration,
        uint256 timestamp
    ) private {
        UserInfo storage info = userInfo[user];
        
        // Guardamos el peso anterior para el evento
        uint256 oldWeight = info.userWeight;
        
        // Actualizamos los datos del usuario
        info.stakedAmount = stakedAmount;
        info.productivity = productivity;
        info.lockDuration = lockDuration;
        
        // Actualizamos el peso del usuario
        uint256 newWeight = calculateUserWeight(stakedAmount, productivity, lockDuration);
        info.userWeight = newWeight;
        
        // Actualizamos el peso total sumando la diferencia
        if (newWeight > oldWeight) {
            unchecked {
                totalUserWeight += (newWeight - oldWeight);
            }
        } else if (oldWeight > newWeight) {
            unchecked {
                totalUserWeight -= (oldWeight - newWeight);
            }
        }
        
        // Emitimos eventos
        emit UserWeightUpdated(user, oldWeight, newWeight, timestamp);
        emit UserStakeUpdated(user, stakedAmount, timestamp);
        emit UserProductivityUpdated(user, productivity, timestamp);
        emit UserLockDurationUpdated(user, lockDuration, timestamp);
    }
    
    /**
     * @dev Elimina un usuario elegible
     * @param user Dirección del usuario
     */
    function removeEligibleClaimer(address user) external virtual override onlyOwner {
        if (eligibleClaimers[user]) {
            uint256 userWeight = userInfo[user].userWeight;
            
            // Restamos el peso del usuario del total
            if (userWeight > 0) {
                unchecked {
                    totalUserWeight -= userWeight;
                }
            }
            
            // Actualizamos el estado
            eligibleClaimers[user] = false;
            unchecked { totalEligibleClaimers--; }
            userInfo[user].isEligible = false;
            userInfo[user].userWeight = 0;
            
            // No eliminamos del array de cuentas con peso para no afectar la iteración,
            // solo actualizamos su peso a 0
            
            emit EligibleClaimerRemoved(user, block.timestamp);
        }
    }
    
    /**
     * @dev Recalcula el peso total de todos los usuarios
     */
    function recalculateTotalUserWeight() external override onlyOwner {
        uint256 calculatedTotalWeight = 0;
        uint256 accountsLength = accountsWithWeight.length;
        
        for (uint256 i = 0; i < accountsLength;) {
            address user = accountsWithWeight[i];
            if (eligibleClaimers[user]) {
                unchecked {
                    calculatedTotalWeight += userInfo[user].userWeight;
                    ++i;
                }
            }
            else {
                unchecked { ++i; }
            }
        }
        
        // Actualiza el peso total
        uint256 oldTotalWeight = totalUserWeight;
        totalUserWeight = calculatedTotalWeight;
        
        emit TotalWeightRecalculated(oldTotalWeight, calculatedTotalWeight, block.timestamp);
    }
    
    /**
     * @dev Obtiene el número total de usuarios elegibles
     * @return Número de usuarios elegibles
     */
    function getTotalEligibleClaimers() public view override returns (uint256) {
        return totalEligibleClaimers;
    }
    
    /**
     * @dev Verifica si un usuario puede reclamar tokens para una semana
     * Este método es una ayuda interna y no forma parte de la interfaz oficial
     * @param user Dirección del usuario
     * @param week Número de semana
     * @return true si el usuario es elegible y tiene peso
     */
    function _canUserClaim(address user, uint256 week) internal view returns (bool) {
        // Esta función será implementada completamente en el módulo ClaimLogic
        // Aquí solo verificamos lo relacionado con la gestión de usuarios
        return eligibleClaimers[user] && userInfo[user].userWeight > 0 && !hasClaimed[user][week];
    }
    
    /**
     * @dev Obtiene información detallada de un usuario
     * @param user Dirección del usuario
     * @return isEligible Si el usuario es elegible
     * @return totalClaimed Total reclamado por el usuario
     * @return lastClaimWeek Última semana reclamada
     * @return stakingStart Inicio del staking
     * @return userWeight Peso del usuario
     * @return stakedAmount Cantidad stakeada
     * @return productivity Productividad del usuario
     * @return lockDuration Duración del bloqueo
     * @return pendingClaims Reclamos pendientes
     */
    function getUserDetails(address user) external view override returns (
        bool isEligible,
        uint256 totalClaimed,
        uint256 lastClaimWeek,
        uint256 stakingStart,
        uint256 userWeight,
        uint256 stakedAmount,
        uint256 productivity,
        uint256 lockDuration,
        uint256 pendingClaims
    ) {
        UserInfo storage info = userInfo[user];
        
        isEligible = eligibleClaimers[user];
        totalClaimed = info.totalClaimed;
        lastClaimWeek = info.lastClaimWeek;
        stakingStart = info.stakingStart;
        userWeight = info.userWeight;
        stakedAmount = info.stakedAmount;
        productivity = info.productivity;
        lockDuration = info.lockDuration;
        
        // Calcular semanas pendientes de reclamar
        if (isEligible && userWeight > 0) {
            uint256 currWeek = currentWeek;
            for (uint256 week = 0; week <= currWeek;) {
                if (weekDistributed[week] && !hasClaimed[user][week]) {
                    unchecked {
                        ++pendingClaims;
                        ++week;
                    }
                } else {
                    unchecked { ++week; }
                }
            }
        }
    }
} 