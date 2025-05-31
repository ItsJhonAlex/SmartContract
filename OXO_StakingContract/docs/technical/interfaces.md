# Interfaces del Sistema OXO

## Visión General

Las interfaces en el sistema OXO definen contratos que deben ser implementados por módulos específicos. Estas interfaces permiten:

1. Establecer un contrato claro entre los diferentes componentes del sistema
2. Facilitar el reemplazo de implementaciones específicas sin afectar al resto del sistema
3. Mejorar la legibilidad y mantenibilidad del código

## Interfaces Principales

### IERC20

La interfaz estándar para tokens fungibles en Ethereum.

```solidity
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
```

### IOXSStaking

Interfaz principal que integra todas las demás interfaces del sistema de staking.

```solidity
interface IOXSStaking is 
    IUserManagement, 
    IDistribution, 
    IClaimLogic, 
    IEmergency {
    // Esta interfaz combina todas las demás interfaces 
    // No añade métodos propios
}
```

### IUserManagement

Interfaz para la gestión de usuarios, pesos y elegibilidad.

```solidity
interface IUserManagement {
    // Estructuras
    struct UserMetrics {
        uint256 stakedAmount;
        uint256 productivity;
        uint8 stakingWeeks;
        uint256 userWeight;
    }
    
    // Eventos
    event EligibleClaimerAdded(address indexed user);
    event EligibleClaimerRemoved(address indexed user);
    event UserMetricsUpdated(
        address indexed user, 
        uint256 stakedAmount, 
        uint256 productivity, 
        uint8 stakingWeeks, 
        uint256 newUserWeight
    );
    event TotalWeightUpdated(uint256 oldTotalWeight, uint256 newTotalWeight);
    
    // Funciones externas
    function addEligibleClaimer(address user) external;
    function removeEligibleClaimer(address user) external;
    function updateUserMetrics(
        address user, 
        uint256 stakedAmount, 
        uint256 productivity, 
        uint8 stakingWeeks
    ) external;
    function recalculateTotalWeight() external;
    function isEligibleClaimer(address user) external view returns (bool);
    function getUserWeight(address user) external view returns (uint256);
    function getTotalWeight() external view returns (uint256);
    function getUserMetrics(address user) external view returns (UserMetrics memory);
}
```

### IDistribution

Interfaz para la distribución semanal de tokens.

```solidity
interface IDistribution {
    // Eventos
    event WeeklyDistribution(uint256 indexed week, uint256 amount);
    
    // Funciones externas
    function distributeWeeklyTokens(uint256 week) external;
    function distributeMultipleWeeks(uint256 fromWeek, uint256 toWeek) external;
    function transferDistributionOwnership(address newOwner) external;
    function getWeeklyDistribution(uint256 week) external view returns (uint256);
    function getDistributionOwner() external view returns (address);
    function isWeekDistributed(uint256 week) external view returns (bool);
    function getLastDistributedWeek() external view returns (uint256);
    function calculateWeeklyDistribution(uint256 week) external view returns (uint256);
}
```

### IClaimLogic

Interfaz para la reclamación de tokens distribuidos.

```solidity
interface IClaimLogic {
    // Eventos
    event TokensClaimed(address indexed user, uint256 indexed week, uint256 amount);
    
    // Funciones externas
    function claimTokens(uint256 week) external;
    function claimMultipleWeeks(uint256 fromWeek, uint256 toWeek) external;
    function hasUserClaimedForWeek(address user, uint256 week) external view returns (bool);
    function getUserClaimForWeek(address user, uint256 week) external view returns (uint256);
    function calculateUserClaim(address user, uint256 week) external view returns (uint256);
}
```

### IEmergency

Interfaz para funciones de emergencia.

```solidity
interface IEmergency {
    // Eventos
    event EmergencyWithdrawal(address indexed to, uint256 amount);
    
    // Funciones externas
    function emergencyWithdraw(address to, uint256 amount) external;
}
```

## Relaciones Entre Interfaces

Las relaciones entre las diferentes interfaces del sistema se ilustran en el siguiente diagrama:

```
                           +---------------+
                           |    IERC20     |
                           +---------------+
                                   ^
                                   |
                                   | implementa
                                   |
                           +---------------+
                           |   OXSToken    |
                           +---------------+
                                  
+---------------+          +---------------+
| IUserManagement|<--------|  IOXSStaking  |
+---------------+          +---------------+
                                  ^
                                  |
+---------------+                 | hereda
| IDistribution |<----------------+
+---------------+                 |
                                  |
+---------------+                 |
|  IClaimLogic  |<----------------+
+---------------+
                                  |
+---------------+                 |
|  IEmergency   |<----------------+
+---------------+
```

## Implementación de Interfaces

Cada interfaz debe ser implementada por un módulo específico:

1. **IERC20**: Implementada por el contrato `OXSToken`.
2. **IUserManagement**: Implementada por el módulo `UserManagement`.
3. **IDistribution**: Implementada por el módulo `Distribution`.
4. **IClaimLogic**: Implementada por el módulo `ClaimLogic`.
5. **IEmergency**: Implementada por el módulo `Emergency`.
6. **IOXSStaking**: Implementada por el contrato principal `OXSStaking` que integra todos los módulos.

El contrato principal `OXSStaking` combina todos estos módulos para proporcionar la funcionalidad completa del sistema.

## Extensibilidad

El diseño basado en interfaces facilita la extensibilidad del sistema:

1. Se pueden reemplazar implementaciones específicas sin afectar al resto del sistema.
2. Se pueden añadir nuevas interfaces y módulos para ampliar la funcionalidad.
3. Las actualizaciones pueden implementarse de manera más segura al mantener la compatibilidad con las interfaces existentes. 