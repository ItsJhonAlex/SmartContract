// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IClaimLogic.sol";
import "../interfaces/IUserManagement.sol";
import "../libraries/DateTimeLib.sol";
import "./BaseModule.sol";
import "./ReentrancyGuard.sol";

/**
 * @title ClaimLogic
 * @dev Implementación del módulo de reclamación de tokens
 */
abstract contract ClaimLogic is IClaimLogic, BaseModule, ReentrancyGuard {
    /**
     * @dev Inicializa el módulo de reclamación
     */
    function _initializeClaimLogic() internal {
        // No hay inicialización específica adicional
    }
    
    /**
     * @dev Verifica si un usuario puede reclamar tokens para una semana específica
     * @param user Dirección del usuario
     * @param week Número de semana
     * @return true si el usuario puede reclamar tokens
     */
    function canClaimTokens(address user, uint256 week) public view virtual override returns (bool) {
        // Comprobamos primero las condiciones más probables de fallo para hacer short-circuit
        if (!eligibleClaimers[user] || 
            !weekDistributed[week] || 
            hasClaimed[user][week] ||
            userInfo[user].userWeight == 0) {
            return false;
        }
        
        // Luego verificamos las condiciones restantes
        return week <= currentWeek && week < MAX_WEEKS;
    }
    
    /**
     * @dev Permite a un usuario elegible reclamar sus tokens
     * @param week Semana para la que reclama tokens
     */
    function claimTokens(uint256 week) external virtual override nonReentrant {
        address user = msg.sender;
        
        require(canClaimTokens(user, week), "No hay tokens disponibles para reclamar");
        require(totalUserWeight > 0, "No hay peso total de usuarios");
        
        // Cacheamos la información del usuario
        IUserManagement.UserInfo storage userInfoRef = userInfo[user];
        uint256 userWeight = userInfoRef.userWeight;
        
        // Si es el primer claim, registramos el inicio de staking
        if (userInfoRef.stakingStart == 0) {
            userInfoRef.stakingStart = block.timestamp;
            emit StakingStarted(user, week, block.timestamp);
        }
        
        // Calculamos los tokens a reclamar usando el peso proporcional
        uint256 weekDistAmount = weeklyDistribution[week];
        uint256 tokensToClaim = (weekDistAmount * userWeight) / totalUserWeight;
        
        // Actualizamos el estado
        hasClaimed[user][week] = true;
        userInfoRef.totalClaimed += tokensToClaim;
        userInfoRef.lastClaimWeek = week;
        
        // Transferimos los tokens - esta línea debe ser implementada por el contrato que hereda
        _transferTokens(address(this), user, tokensToClaim);
        
        // Emitimos evento
        emit TokensClaimed(user, week, tokensToClaim, userWeight);
    }
    
    /**
     * @dev Permite a un usuario reclamar tokens de múltiples semanas de una vez
     * @param weeksToClaim Array de semanas para reclamar
     */
    function claimMultipleWeeks(uint256[] calldata weeksToClaim) external virtual override nonReentrant {
        address user = msg.sender;
        require(totalUserWeight > 0, "No hay peso total de usuarios");
        
        // Cacheamos información del usuario
        IUserManagement.UserInfo storage userInfoRef = userInfo[user];
        uint256 userWeight = userInfoRef.userWeight;
        
        // Si es el primer claim, registramos el inicio de staking
        if (userInfoRef.stakingStart == 0 && weeksToClaim.length > 0) {
            userInfoRef.stakingStart = block.timestamp;
            emit StakingStarted(user, weeksToClaim[0], block.timestamp);
        }
        
        uint256 totalClaim = 0;
        uint256 lastWeekClaimed = 0;
        bool hasValidClaims = false;
        
        // Usamos un bucle clásico para mayor eficiencia de gas
        uint256 weeksLength = weeksToClaim.length;
        require(weeksLength <= 52, "Demasiadas semanas para reclamar a la vez");
        
        for (uint256 i = 0; i < weeksLength; ++i) {
            uint256 week = weeksToClaim[i];
            
            if (canClaimTokens(user, week)) {
                // Calculamos los tokens a reclamar usando el peso proporcional
                uint256 weekDistAmount = weeklyDistribution[week];
                uint256 tokensToClaim = (weekDistAmount * userWeight) / totalUserWeight;
                
                // Actualizamos el estado
                hasClaimed[user][week] = true;
                totalClaim += tokensToClaim;
                lastWeekClaimed = week;
                hasValidClaims = true;
                
                // Emitimos evento para cada semana
                emit TokensClaimed(user, week, tokensToClaim, userWeight);
            }
        }
        
        // Actualizamos totalClaimed y lastClaimWeek solo una vez
        if (hasValidClaims) {
            userInfoRef.totalClaimed += totalClaim;
            userInfoRef.lastClaimWeek = lastWeekClaimed;
            
            // Si hay tokens para reclamar, los transferimos
            if (totalClaim > 0) {
                _transferTokens(address(this), user, totalClaim);
            }
        }
    }
    
    /**
     * @dev Finaliza el staking de un usuario
     * Emite un evento con la duración total del staking
     */
    function endStaking() external virtual override {
        address user = msg.sender;
        require(eligibleClaimers[user], "El usuario no es elegible para staking");
        
        // Cacheamos información del usuario
        IUserManagement.UserInfo storage userInfoRef = userInfo[user];
        uint256 stakingStartTime = userInfoRef.stakingStart;
        
        require(stakingStartTime > 0, "El usuario no ha iniciado staking");
        
        uint256 stakingDuration = (block.timestamp - stakingStartTime) / DateTimeLib.SECONDS_PER_WEEK;
        
        // Emitimos evento de fin de staking
        emit StakingEnded(user, stakingDuration, block.timestamp);
        
        // Limpiamos datos de staking pero mantenemos historial de claims
        userInfoRef.stakingStart = 0;
    }
    
    /**
     * @dev Obtiene el total de tokens pendientes de reclamar para un usuario
     * @param user Dirección del usuario
     * @return Tokens totales pendientes de reclamar
     */
    function getPendingTokens(address user) external view virtual override returns (uint256) {
        if (!eligibleClaimers[user] || userInfo[user].userWeight == 0) {
            return 0;
        }
        
        uint256 totalPending = 0;
        uint256 userWeight = userInfo[user].userWeight;
        uint256 currWeek = currentWeek;
        
        // Iteramos solo hasta la semana actual para ahorrar gas
        for (uint256 week = 0; week <= currWeek; ++week) {
            // Verificamos cada condición por separado para short-circuit temprano
            if (weekDistributed[week] && !hasClaimed[user][week]) {
                // Calculamos los tokens a reclamar usando el peso proporcional
                uint256 tokensToClaim = (weeklyDistribution[week] * userWeight) / totalUserWeight;
                totalPending += tokensToClaim;
            }
        }
        
        return totalPending;
    }
    
    /**
     * @dev Función interna para transferir tokens, debe ser implementada por el contrato que hereda
     * @param from Dirección origen
     * @param to Dirección destino
     * @param amount Cantidad a transferir
     */
    function _transferTokens(address from, address to, uint256 amount) internal virtual;
} 