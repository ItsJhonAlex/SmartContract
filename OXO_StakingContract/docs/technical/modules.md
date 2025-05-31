# Módulos del Sistema OXO

Este documento describe en detalle cada uno de los módulos que componen el sistema OXO, sus responsabilidades y cómo interactúan entre sí.

## 1. BaseModule

`BaseModule` es el módulo fundamental que contiene las variables de estado y estructuras de datos compartidas entre todos los módulos del sistema.

### Variables Principales

- `TOTAL_SUPPLY`: Suministro total de tokens (62.5M con 18 decimales).
- `MAX_WEEKS`: Número total de semanas de distribución (728).
- `totalDistributed`: Total de tokens distribuidos hasta el momento.
- `startTime`: Timestamp de inicio del sistema.
- `currentWeek`: Semana actual del sistema.
- `weeklyDistribution`: Mapeo que asigna a cada semana su cantidad de tokens distribuidos.
- `weekDistributed`: Mapeo que indica si una semana ya ha sido distribuida.
- `totalUserWeight`: Suma total de los pesos de todos los usuarios elegibles.
- `eligibleClaimers`: Mapeo que indica si un usuario es elegible para reclamar tokens.
- `userInfo`: Mapeo que almacena la información detallada de cada usuario.
- `hasClaimed`: Mapeo que registra si un usuario ha reclamado tokens para una semana específica.
- `distributionHistory`: Array que guarda el historial completo de distribuciones.

### Inicialización

El módulo se inicializa estableciendo el tiempo de inicio, la semana actual y el total distribuido.

## 2. UserManagement

`UserManagement` implementa la gestión de usuarios elegibles y sus pesos relativos en el sistema.

### Funcionalidades Principales

#### Adición de Usuarios Elegibles

- `addEligibleClaimer`: Añade un único usuario elegible con sus métricas iniciales.
- `addMultipleEligibleClaimers`: Añade múltiples usuarios elegibles en una sola transacción.

#### Gestión de Métricas

- `updateUserMetrics`: Actualiza las métricas de un usuario (cantidad stakeada, productividad, duración de bloqueo).
- `calculateUserWeight`: Calcula el peso de un usuario basado en sus métricas.

#### Otras Funciones

- `removeEligibleClaimer`: Elimina un usuario de la lista de elegibles.
- `recalculateTotalUserWeight`: Recalcula el peso total del sistema para corregir posibles inconsistencias.
- `getUserDetails`: Obtiene información detallada de un usuario.
- `getTotalEligibleClaimers`: Devuelve el número total de usuarios elegibles.

### Fórmula de Peso

El peso de un usuario se calcula según la siguiente fórmula:
```
weight = (stakedAmount * (100 + lockDuration) * (100 + productivity)) / 10000
```

Donde:
- `stakedAmount`: Cantidad de tokens stakeados por el usuario.
- `lockDuration`: Duración del bloqueo en semanas (máximo 104 semanas).
- `productivity`: Valor de productividad del usuario (rango 0-100).

## 3. Distribution

`Distribution` implementa la lógica de distribución semanal de tokens basada en una función de crecimiento logarítmica.

### Funcionalidades Principales

#### Distribución de Tokens

- `distributeWeeklyTokens`: Distribuye tokens para la semana actual.
- `distributeMultipleWeeks`: Distribuye tokens para múltiples semanas en una sola transacción.

#### Cálculos y Consultas

- `calculateWeeklyTokens`: Calcula la cantidad de tokens a distribuir para una semana específica.
- `getCurrentWeek`: Obtiene el número de la semana actual basado en el tiempo transcurrido.
- `getDistributionHistory`: Obtiene el historial completo de distribuciones.

### Fórmula de Distribución

La cantidad de tokens distribuidos por semana se calcula mediante:

```
tokensToDistribute = (TOTAL_SUPPLY / MAX_WEEKS) * ln(week+5) / ln(250)
```

Esta fórmula proporciona una curva de distribución logarítmica que comienza más alta y va decreciendo gradualmente a lo largo del tiempo.

## 4. ClaimLogic

`ClaimLogic` implementa la lógica para que los usuarios elegibles reclamen sus tokens según su peso relativo.

### Funcionalidades Principales

#### Reclamación de Tokens

- `claimTokens`: Permite a un usuario reclamar tokens para una semana específica.
- `claimMultipleWeeks`: Permite a un usuario reclamar tokens para múltiples semanas de forma eficiente.
- `endStaking`: Finaliza el staking de un usuario y emite un evento con la duración.

#### Verificaciones y Consultas

- `canClaimTokens`: Verifica si un usuario puede reclamar tokens para una semana específica.
- `getPendingTokens`: Obtiene el total de tokens pendientes de reclamar para un usuario.

### Cálculo de Tokens a Reclamar

Los tokens a reclamar por un usuario se calculan proporcionalmente a su peso relativo:

```
tokensToClaim = (weeklyDistribution[week] * userWeight) / totalUserWeight
```

## 5. Emergency

`Emergency` proporciona funcionalidades para gestionar situaciones de emergencia y pausa del sistema.

### Funcionalidades Principales

- `emergencyWithdraw`: Permite al propietario retirar tokens en caso de emergencia.
- `pause`: Pausa todas las transferencias en el sistema.
- `unpause`: Reanuda las transferencias en el sistema después de una pausa.

## 6. ReentrancyGuard

`ReentrancyGuard` implementa protección contra ataques de reentrancia para las funciones críticas del sistema.

### Funcionamiento

- Utiliza un modificador `nonReentrant` que cambia un estado interno para prevenir llamadas reentradas.
- Se aplica a funciones que realizan transferencias de tokens o modifican el estado del sistema.

## 7. TimeGuard

`TimeGuard` proporciona protecciones contra manipulaciones temporales por parte de mineros.

### Funcionalidades

- `timeLimited`: Modificador que impone un tiempo mínimo entre operaciones.
- `timeGuarded`: Modificador que combina restricciones de tiempo con verificaciones de bloques.

### Parámetros de Seguridad

- `MIN_TIME_BETWEEN_OPERATIONS`: Tiempo mínimo entre operaciones (15 minutos).

## 8. OXSToken

`OXSToken` es el contrato principal que integra todos los módulos anteriores y implementa el token ERC20 estándar.

### Características

- Hereda de ERC20 para implementar la funcionalidad estándar de tokens.
- Integra todos los módulos especializados para proporcionar la funcionalidad completa del sistema.
- Sobrescribe `_update` para implementar la funcionalidad de pausa.
- Implementa `_transferTokens` y `getBalance` para las operaciones internas del sistema. 