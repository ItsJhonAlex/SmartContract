# Guía de Administración del Sistema OXO

Esta guía está destinada a los administradores del sistema OXO y detalla las operaciones administrativas disponibles para gestionar el sistema de distribución de tokens.

## Funciones Administrativas

### 1. Gestión de Usuarios

#### Añadir Usuarios Elegibles

Para añadir un usuario elegible al sistema:

```javascript
// Usando web3.js
const oxoContract = new web3.eth.Contract(OXO_ABI, OXO_ADDRESS);

// Añadir un único usuario
await oxoContract.methods.addEligibleClaimer(
  userAddress,      // Dirección del usuario
  stakedAmount,     // Cantidad stakeada (con 18 decimales)
  productivity,     // Productividad (0-100)
  lockDuration      // Duración de bloqueo en semanas
).send({ from: adminAddress });

// Añadir múltiples usuarios
await oxoContract.methods.addMultipleEligibleClaimers(
  [user1, user2, user3],                // Array de direcciones
  [amount1, amount2, amount3],          // Array de cantidades stakeadas
  [productivity1, productivity2, productivity3], // Array de productividades
  [duration1, duration2, duration3]     // Array de duraciones
).send({ from: adminAddress });
```

#### Actualizar Métricas de Usuario

Para actualizar las métricas de un usuario existente:

```javascript
await oxoContract.methods.updateUserMetrics(
  userAddress,      // Dirección del usuario
  newStakedAmount,  // Nueva cantidad stakeada
  newProductivity,  // Nueva productividad
  newLockDuration   // Nueva duración de bloqueo
).send({ from: adminAddress });
```

#### Eliminar Usuario Elegible

Para eliminar un usuario de la lista de elegibles:

```javascript
await oxoContract.methods.removeEligibleClaimer(
  userAddress       // Dirección del usuario a eliminar
).send({ from: adminAddress });
```

#### Recalcular Peso Total

Si sospechas que el peso total del sistema se ha desincronizado:

```javascript
await oxoContract.methods.recalculateTotalUserWeight().send({ from: adminAddress });
```

### 2. Distribución de Tokens

#### Distribuir Tokens Semanales

Para distribuir tokens para la semana actual:

```javascript
await oxoContract.methods.distributeWeeklyTokens().send({ from: adminAddress });
```

**Importante**: Esta función solo puede ejecutarse una vez por semana y cuando la semana actual ha transcurrido completamente.

#### Distribuir Tokens para Múltiples Semanas

Para distribuir tokens para un rango de semanas pasadas:

```javascript
await oxoContract.methods.distributeMultipleWeeks(
  startWeek,        // Semana inicial
  endWeek           // Semana final (inclusive)
).send({ from: adminAddress });
```

**Nota**: Solo puedes distribuir hasta 52 semanas en una sola transacción para evitar alcanzar el límite de gas.

### 3. Funciones de Emergencia

#### Pausar el Sistema

En caso de emergencia, puedes pausar todas las transferencias:

```javascript
await oxoContract.methods.pause().send({ from: adminAddress });
```

#### Reanudar el Sistema

Para reanudar las operaciones después de una pausa:

```javascript
await oxoContract.methods.unpause().send({ from: adminAddress });
```

#### Retiro de Emergencia

Para retirar tokens en caso de emergencia:

```javascript
await oxoContract.methods.emergencyWithdraw(
  amount,           // Cantidad a retirar
  destinationAddress // Dirección de destino
).send({ from: adminAddress });
```

**Advertencia**: Esta función debe usarse solo en situaciones de emergencia, ya que permite retirar tokens sin respetar el mecanismo normal de distribución.

## Monitoreo del Sistema

### Consultar Estado Actual

Para verificar el estado actual del sistema:

```javascript
// Obtener semana actual
const currentWeek = await oxoContract.methods.getCurrentWeek().call();

// Obtener total distribuido
const totalDistributed = await oxoContract.methods.totalDistributed().call();

// Verificar si una semana específica ya fue distribuida
const isDistributed = await oxoContract.methods.weekDistributed(weekNumber).call();

// Obtener cantidad distribuida para una semana específica
const weeklyAmount = await oxoContract.methods.weeklyDistribution(weekNumber).call();
```

### Consultar Historial de Distribuciones

Para obtener el historial completo de distribuciones:

```javascript
const distributionHistory = await oxoContract.methods.getDistributionHistory().call();
// Cada entrada tiene: { week, amount, timestamp }
```

### Consultar Información de Usuarios

Para obtener información detallada sobre un usuario:

```javascript
const userDetails = await oxoContract.methods.getUserDetails(userAddress).call();
// Devuelve múltiples valores: isEligible, totalClaimed, lastClaimWeek, etc.

// Verificar si un usuario puede reclamar para una semana específica
const canClaim = await oxoContract.methods.canClaimTokens(userAddress, weekNumber).call();

// Obtener tokens pendientes de un usuario
const pendingTokens = await oxoContract.methods.getPendingTokens(userAddress).call();
```

## Buenas Prácticas Administrativas

### Distribución Regular

- Distribuye tokens regularmente cada semana para evitar acumulación de semanas no distribuidas.
- Configura un proceso automatizado para llamar a `distributeWeeklyTokens()` cada semana.

### Gestión de Usuarios

- Mantén un registro off-chain de todas las actualizaciones de usuarios.
- Verifica periódicamente que `totalUserWeight` sea correcto ejecutando `recalculateTotalUserWeight()`.
- Documenta criterios claros para la asignación de productividad y duración de bloqueo.

### Seguridad

- Utiliza una cuenta multifirma para operaciones administrativas.
- Implementa un tiempo de espera (timelock) para funciones críticas.
- Mantén una copia de seguridad de la lista de usuarios elegibles.
- Mantén la clave privada administrativa en un dispositivo seguro, preferiblemente hardware.

### Monitoreo

- Implementa alertas para eventos críticos como `EmergencyWithdrawal` o `TotalWeightRecalculated`.
- Monitorea el gas utilizado en operaciones por lotes para evitar fallos por límite de gas.
- Verifica periódicamente la consistencia del estado del contrato.

## Resolución de Problemas Comunes

### Problema: Distribución Fallida

Si `distributeWeeklyTokens()` falla:
1. Verifica que la semana actual haya transcurrido completamente
2. Verifica que la semana no haya sido distribuida ya
3. Verifica que no estés intentando distribuir más allá de MAX_WEEKS

### Problema: Reclamación Fallida de Usuario

Si los usuarios reportan problemas al reclamar:
1. Verifica su elegibilidad con `eligibleClaimers(userAddress)`
2. Verifica que la semana haya sido distribuida con `weekDistributed(weekNumber)`
3. Verifica que no hayan reclamado ya para esa semana con `hasClaimed(userAddress, weekNumber)`
4. Verifica que tienen un peso mayor que cero con `userInfo(userAddress).userWeight`

### Problema: Peso Total Inconsistente

Si sospechas que el peso total está desincronizado:
1. Ejecuta `recalculateTotalUserWeight()`
2. Verifica el evento `TotalWeightRecalculated` para confirmar la corrección 