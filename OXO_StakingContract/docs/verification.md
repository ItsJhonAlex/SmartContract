# Verificación Formal de Contratos OXO

Este documento detalla el análisis formal de los contratos inteligentes del proyecto OXO, identificando invariantes críticos, propiedades de seguridad y posibles vulnerabilidades.

## Invariantes Críticos del Sistema

### Invariantes Tokenómicos

1. **Invariante de suministro total:**
   ```
   TOTAL_SUPPLY = balance(address(this)) + Σ balance(user_i) para todo i
   ```
   - La suma de todos los balances debe ser siempre igual al TOTAL_SUPPLY.
   - Debe mantenerse en todo momento durante las operaciones `claimTokens` y `emergencyWithdraw`.

2. **Invariante de distribución semanal:**
   ```
   Σ weeklyDistribution[w] <= TOTAL_SUPPLY para todas las semanas w
   ```
   - El total distribuido nunca debe exceder el suministro total del token.

3. **Invariante de reclamos por semana:**
   ```
   Σ tokensClaimed[user][week] <= weeklyDistribution[week] para todos los usuarios
   ```
   - La suma de todos los tokens reclamados por todos los usuarios para una semana dada nunca debe exceder la distribución asignada para esa semana.

4. **Invariante de peso total:**
   ```
   totalUserWeight = Σ userInfo[user].userWeight para todo usuario elegible
   ```
   - El peso total del sistema debe ser igual a la suma de los pesos individuales de todos los usuarios elegibles.

### Invariantes de Seguridad

1. **Invariante de control de acceso:**
   - Solo el propietario puede invocar funciones marcadas con `onlyOwner`.
   - Solo los usuarios elegibles pueden reclamar tokens.

2. **Invariante de estado de reclamo:**
   - Un usuario no puede reclamar tokens para la misma semana más de una vez: `hasClaimed[user][week] => !canClaimTokens(user, week)`.

3. **Invariante de pausabilidad:**
   - Cuando el contrato está pausado, ninguna transferencia debe ser posible.

## Propiedades de Seguridad

### Propiedades de ClaimLogic

1. **Propiedades de reclamo seguro:**
   - P1: `claimTokens(week)` para un usuario sin peso debería fallar.
   - P2: `claimTokens(week)` para una semana no distribuida debería fallar.
   - P3: `claimTokens(week)` no debe permitir reclamar semanas futuras.
   - P4: `claimMultipleWeeks([...])` debe ser equivalente a llamar `claimTokens(week)` múltiples veces.

2. **Propiedades de distribución proporcional:**
   - P5: La cantidad de tokens reclamados por un usuario es proporcional a su peso relativo.
   - P6: `(userWeight / totalUserWeight) * weeklyDistribution[week] = tokensToClaim`

### Propiedades de Distribution

1. **Propiedades de distribución segura:**
   - P7: `distributeWeeklyTokens()` para una semana ya distribuida debe fallar.
   - P8: `distributeWeeklyTokens()` no debe permitir distribuir semanas futuras.
   - P9: La fórmula logarítmica debe garantizar que la suma de todas las distribuciones no exceda TOTAL_SUPPLY.

2. **Propiedades de actualización de estado:**
   - P10: Después de distribuir una semana, `weekDistributed[week]` debe ser true.
   - P11: `currentWeek` debe reflejar correctamente la semana actual basada en `startTime`.

### Propiedades de UserManagement

1. **Propiedades de gestión de usuarios:**
   - P12: Después de añadir un usuario, `eligibleClaimers[user]` debe ser true.
   - P13: Después de eliminar un usuario, su peso no debe contribuir al peso total.
   - P14: La actualización de métricas de un usuario debe actualizar correctamente el peso total.

2. **Propiedades de consistencia de datos:**
   - P15: El cálculo de peso debe ser determinístico y consistente.
   - P16: `recalculateTotalUserWeight()` debe restaurar la consistencia del peso total.

## Posibles Vulnerabilidades y Mitigaciones

### Problemas Matemáticos

1. **División por cero:**
   - Vulnerabilidad: En `claimTokens`, si `totalUserWeight` es cero, la transacción fallaría.
   - Mitigación: Verificación explícita `require(totalUserWeight > 0, "No hay peso total de usuarios")`.

2. **Desbordamiento aritmético:**
   - Vulnerabilidad: Posibles desbordamientos en cálculos de peso y distribución.
   - Mitigación: Uso de `unchecked` solo donde es seguro, después de validaciones apropiadas.

3. **Precisión en divisiones:**
   - Vulnerabilidad: Pérdida de precisión en cálculos que involucran división.
   - Mitigación: Realizar multiplicaciones antes de divisiones para mantener precisión.

### Problemas de Control de Acceso

1. **Control de privilegios:**
   - Vulnerabilidad: Funciones críticas accesibles por usuarios no autorizados.
   - Mitigación: Uso consistente de `onlyOwner` y verificaciones `require` apropiadas.

2. **Manipulación de parámetros:**
   - Vulnerabilidad: Parámetros de entrada manipulables en `addEligibleClaimer` y otras funciones.
   - Mitigación: Validaciones exhaustivas de los parámetros de entrada.

### Problemas de Estado

1. **Estado inconsistente:**
   - Vulnerabilidad: Estado del sistema inconsistente después de operaciones parciales.
   - Mitigación: Funciones de actualización atómica como `_updateDistributionState`.

2. **Reentrada:**
   - Vulnerabilidad: Posibles ataques de reentrada en `claimTokens` y `emergencyWithdraw`.
   - Mitigación: Patrón checks-effects-interactions implementado correctamente.

## Funciones Críticas y Verificación Específica

### 1. ClaimLogic.claimTokens

```solidity
function claimTokens(uint256 week) external virtual override {
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
    
    // Transferimos los tokens
    _transferTokens(address(this), user, tokensToClaim);
    
    emit TokensClaimed(user, week, tokensToClaim, userWeight);
}
```

**Verificación:**
- ✅ Validación de precondiciones: Verifica que el usuario puede reclamar y que hay peso total.
- ✅ Patrón checks-effects-interactions: Modifica estado antes de realizar la transferencia.
- ✅ Actualización consistente de estado: Establece hasClaimed antes de transferir.
- ⚠️ División segura: Verificar que totalUserWeight nunca sea 0 (mitigado con require).
- ⚠️ Posible reentrada: Aunque sigue el patrón CEI, depende de la implementación de _transferTokens.

### 2. Distribution.distributeWeeklyTokens

```solidity
function distributeWeeklyTokens() external virtual override onlyOwner {
    uint256 week = getCurrentWeek();
    
    require(week < MAX_WEEKS, "Todas las semanas han sido distribuidas");
    require(!weekDistributed[week], "Tokens ya distribuidos para esta semana");
    
    uint256 tokensToDistribute = calculateWeeklyTokens(week);
    uint256 timestamp = block.timestamp;
    
    _updateDistributionState(week, tokensToDistribute, timestamp);
    
    emit WeeklyDistribution(week, tokensToDistribute, timestamp);
}
```

**Verificación:**
- ✅ Control de acceso: Solo el propietario puede distribuir tokens.
- ✅ Validación de condiciones: Verifica límites y evita doble distribución.
- ✅ Actualización atómica: Usa función auxiliar para mantener consistencia.
- ✅ Trazabilidad de eventos: Emite evento con información relevante.
- ⚠️ Dependencia temporal: La función depende de block.timestamp para determinar la semana actual.

### 3. Emergency.emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 amount, address destination) external virtual override onlyOwner {
    require(destination != address(0), "Destino invalido");
    
    uint256 contractBalance = getBalance(address(this));
    require(amount <= contractBalance, "Fondos insuficientes");
    
    _transferTokens(address(this), destination, amount);
    
    emit EmergencyWithdrawal(amount, destination, block.timestamp);
}
```

**Verificación:**
- ✅ Control de acceso: Solo el propietario puede realizar retiros de emergencia.
- ✅ Validación de parámetros: Verifica destino válido y fondos suficientes.
- ✅ Trazabilidad de eventos: Emite evento con información relevante.
- ⚠️ Posible reentrada: Depende de la implementación de _transferTokens.
- ⚠️ Bypassing de mecanismos: Permite extraer fondos sin respetar el mecanismo de distribución.

## Recomendaciones

1. **Implementar Reentrancy Guard:** Añadir protección contra reentrada en funciones críticas.

2. **Agregar pruebas exhaustivas:** Desarrollar pruebas que verifiquen todos los invariantes identificados.

3. **Limitar control del propietario:** Considerar mecanismos de gobernanza multi-firma o timelock para funciones críticas.

4. **Validaciones adicionales:** Agregar más verificaciones de seguridad, especialmente en funciones con parámetros manipulables.

5. **Auditoría externa:** Realizar una auditoría de seguridad por especialistas independientes antes del despliegue en mainnet.

## Conclusión

Los contratos implementan un sistema de distribución semanal con mecanismos de ponderación para usuarios elegibles. El diseño modular facilita la comprensión y el mantenimiento. Los invariantes identificados permiten una verificación formal de las propiedades críticas del sistema.

Las optimizaciones de gas implementadas mantienen la seguridad general del sistema, pero se recomienda implementar las mitigaciones sugeridas para las vulnerabilidades potenciales antes del despliegue en producción. 