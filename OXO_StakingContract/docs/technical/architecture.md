# Arquitectura del Sistema OXO

## Visión General

El sistema OXO está diseñado con una arquitectura modular que separa las diferentes funcionalidades en componentes independientes y reutilizables. Esta arquitectura facilita el mantenimiento, las pruebas y posibles actualizaciones futuras. La separación clara entre el token OXS y los contratos de staking permite una mayor flexibilidad y seguridad en el sistema.

## Diagrama de Arquitectura

```
+---------------------------+     +---------------------------+
|        OXSToken           |     |       OXSStaking          |
+---------------------------+     +---------------------------+
           |                                  |
           | implementa                       | integra
           v                                  v
+---------------------------+     +---------------------------+
|        IERC20             |     |     Módulos de Staking    |<----+
+---------------------------+     +---------------------------+     |
                                     |            |                 |
                                     v            v                 |
                           +-----------------+  +-----------------+ |
                           | UserManagement  |  |  Distribution   | |
                           +-----------------+  +-----------------+ |
                                     |            |                 |
                                     v            v                 |
                           +-----------------+  +-----------------+ |
                           |   ClaimLogic    |  |    Emergency    |-+
                           +-----------------+  +-----------------+
                                               |
                                               | utilizan
                                               v
                                  +---------------------------+
                                  |      Bibliotecas          |
                                  +---------------------------+
```

## Componentes Principales

### 1. Contratos Principales

- **OXSToken**: Implementación estándar de un token ERC-20 con funcionalidades de mint y burn limitadas al propietario. Este contrato es independiente del sistema de staking.
- **OXSStaking**: Contrato principal de staking que integra todos los módulos de gestión de distribución y reclamación de tokens. Interactúa con el token OXS a través de la interfaz IERC20.

### 2. Interfaces

Las interfaces definen las funcionalidades que deben implementar los diferentes módulos y proveen una capa de abstracción que facilita la interoperabilidad.

- **IERC20**: Interfaz estándar para tokens fungibles que el OXSToken implementa.
- **IOXSStaking**: Interfaz principal que extiende todas las interfaces de módulos.
- **IUserManagement**: Define las funciones para gestionar usuarios elegibles y sus pesos.
- **IDistribution**: Define las funciones para la distribución semanal de tokens.
- **IClaimLogic**: Define las funciones para reclamar tokens distribuidos.
- **IEmergency**: Define las funciones de emergencia del sistema.

### 3. Módulos Especializados

Implementan funcionalidades específicas del sistema:

- **UserManagement**: Implementa la gestión de usuarios, pesos y elegibilidad.
- **Distribution**: Implementa la distribución logarítmica semanal de tokens.
- **ClaimLogic**: Implementa la lógica de reclamación de tokens por usuarios elegibles.
- **Emergency**: Implementa funciones de emergencia.
- **TimeGuard**: Proporciona protecciones contra manipulaciones temporales.
- **ReentrancyGuard**: Protege contra ataques de reentrancia.

### 4. Bibliotecas

Proporcionan funcionalidades auxiliares para cálculos específicos:

- **DateTimeLib**: Funciones para cálculos de fechas y tiempos.
- **LogarithmLib**: Implementa cálculos logarítmicos para la distribución de tokens.

## Flujo de Datos

### Flujo Inicial

1. El contrato **OXSToken** se despliega como un token independiente, con su propio suministro y gestión.
2. El contrato **OXSStaking** se despliega después, recibiendo la dirección del token OXS como parámetro para poder interactuar con él.
3. El propietario del token OXS aprueba y transfiere una cantidad de tokens al contrato de staking para la distribución.

### Distribución de Tokens

1. El propietario llama a `distributeWeeklyTokens()` o `distributeMultipleWeeks()` en el contrato de staking.
2. El sistema calcula la cantidad de tokens a distribuir usando `LogarithmLib`.
3. Los tokens se marcan como distribuidos para la semana específica en `weekDistributed`.
4. Se emite un evento `WeeklyDistribution` para cada semana distribuida.

### Reclamación de Tokens

1. Un usuario elegible llama a `claimTokens(week)` o `claimMultipleWeeks()`.
2. El sistema verifica la elegibilidad y que los tokens estén disponibles para reclamar.
3. Se calcula la cantidad proporcional de tokens basada en el peso relativo del usuario.
4. Los tokens se transfieren al usuario desde el balance del contrato de staking.
5. Se emiten eventos `TokensClaimed` para cada reclamación exitosa.

## Patrones de Diseño

### 1. Patrón Modular

El sistema utiliza un enfoque modular para separar las diferentes funcionalidades, facilitando el mantenimiento y las pruebas.

### 2. Patrón de Control de Acceso

Las funciones administrativas están protegidas con el modificador `onlyOwner` para garantizar que solo el propietario pueda ejecutarlas.

### 3. Patrón Guarda

Se utilizan diversos mecanismos de protección como `ReentrancyGuard` y `TimeGuard` para prevenir vulnerabilidades comunes.

### 4. Patrón de Estado

El sistema gestiona cuidadosamente el estado interno para garantizar la consistencia de los datos y evitar condiciones de carrera.

### 5. Patrón de Separación de Responsabilidades

Se separa claramente la funcionalidad del token (OXSToken) del mecanismo de distribución y staking (OXSStaking), siguiendo el principio de responsabilidad única. Esto permite que cada contrato se enfoque en su tarea específica sin crear dependencias innecesarias.

## Consideraciones de Implementación

### 1. Optimización de Gas

- Uso estratégico de `unchecked` para operaciones que no pueden desbordarse.
- Cacheo de valores de almacenamiento para minimizar lecturas costosas.
- Agrupación de actualizaciones de estado para reducir operaciones de escritura.

### 2. Seguridad

- Implementación del patrón checks-effects-interactions para prevenir reentrancia.
- Validaciones exhaustivas de parámetros de entrada y condiciones de estado.
- Uso de modificadores para aplicar restricciones de manera consistente.
- Aislamiento del token OXS del sistema de staking para minimizar el impacto de posibles vulnerabilidades.

### 3. Precisión Numérica

- Uso de representaciones de punto fijo para cálculos logarítmicos.
- Ordenamiento cuidadoso de operaciones matemáticas para preservar la precisión.
- Validaciones de casos límite para evitar resultados inesperados.

### 4. Despliegue y Red

- Configuración optimizada para la red Polygon (Mainnet y Mumbai).
- Uso de HDWalletProvider para gestionar el despliegue seguro.
- Estructura de migración que garantiza el correcto orden de despliegue y configuración inicial. 