# Bibliotecas del Sistema OXO

Este documento describe en detalle las bibliotecas utilizadas en el sistema OXO para realizar cálculos específicos y optimizar el consumo de gas.

## 1. DateTimeLib

`DateTimeLib` es una biblioteca que proporciona funciones para cálculos relacionados con fechas y tiempos en el sistema.

### Constantes

- `SECONDS_PER_WEEK`: Número de segundos en una semana (604800 = 7 * 24 * 60 * 60).

### Funciones

#### `calculateWeeksSince`

```solidity
function calculateWeeksSince(uint256 startTime) public view returns (uint256)
```

**Descripción:** Calcula el número de semanas completas transcurridas desde un timestamp de inicio hasta el momento actual.

**Parámetros:**
- `startTime`: Timestamp de inicio en segundos.

**Retorno:** Número de semanas completas transcurridas.

**Comportamiento:**
- Si el tiempo actual es menor o igual que el tiempo de inicio, retorna 0.
- Calcula la diferencia entre el tiempo actual y el tiempo de inicio en segundos.
- Divide la diferencia por el número de segundos en una semana (604800).

**Optimizaciones:**
- Utiliza `unchecked` para la resta y división cuando se ha verificado que no puede haber desbordamiento.

**Ejemplo de uso:**
```solidity
uint256 weeksPassed = DateTimeLib.calculateWeeksSince(contractStartTime);
```

## 2. LogarithmLib

`LogarithmLib` es una biblioteca que implementa cálculos logarítmicos optimizados para gas, utilizados principalmente en la distribución de tokens.

### Constantes

- `LN_250_FIXED`: Valor precalculado de ln(250) * 10^12.
- `RANGE1_SLOPE` a `RANGE6_SLOPE`: Pendientes precalculadas para diferentes rangos de valores de entrada.
- `RANGE2_BASE` a `RANGE6_BASE`: Valores base precalculados para diferentes rangos.

### Funciones

#### `calculateGrowthFactor`

```solidity
function calculateGrowthFactor(uint256 week) public pure returns (uint256)
```

**Descripción:** Calcula el factor de crecimiento logarítmico para una semana específica, utilizado en la distribución de tokens.

**Parámetros:**
- `week`: Número de semana para la que se calcula el factor.

**Retorno:** Factor de crecimiento en formato punto fijo (fixed point) con 18 decimales.

**Fórmula matemática:**
```
factor = ln(week+5) / ln(250) * 10^18
```

**Implementación técnica:**
- En lugar de calcular logaritmos directamente (lo cual es costoso en la EVM), utiliza aproximaciones lineales por tramos.
- Divide el dominio de entrada en varios rangos y utiliza una aproximación lineal para cada rango.
- Para cada rango, la aproximación tiene la forma: `base + (input - rangeStart) * slope`.

**Optimizaciones:**
- Valores precalculados para reducir operaciones en cadena.
- Uso de `unchecked` para operaciones que no pueden desbordarse.
- División como operación final para mantener la precisión.

**Rangos implementados:**
1. 5-10: Aproximación directa con pendiente constante
2. 11-50: Base + pendiente por offset
3. 51-100: Base + pendiente por offset
4. 101-200: Base + pendiente por offset
5. 201-400: Base + pendiente por offset
6. 401+: Base + pendiente por offset

**Ejemplo de uso:**
```solidity
uint256 factor = LogarithmLib.calculateGrowthFactor(currentWeek);
uint256 tokensToDistribute = baseAmount * factor / 10**18;
```

## Consideraciones de Seguridad

### Precisión Numérica

- Las bibliotecas utilizan representaciones de punto fijo para mantener la precisión en cálculos que involucran números decimales.
- La precisión en `LogarithmLib` está cuidadosamente calculada para equilibrar exactitud y consumo de gas.

### Desbordamiento y Subdesbordamiento

- Las operaciones que podrían causar desbordamiento están protegidas con condiciones previas o utilizan Solidity 0.8.x, que tiene protección contra desbordamiento por defecto.
- El uso de `unchecked` está limitado a operaciones que han sido verificadas como seguras para optimizar gas.

### Optimización de Gas

- Las bibliotecas están diseñadas para minimizar el consumo de gas mediante el uso de valores precalculados y optimizaciones algorítmicas.
- La separación en bibliotecas permite reutilizar el código, reduciendo el tamaño del bytecode de los contratos principales. 