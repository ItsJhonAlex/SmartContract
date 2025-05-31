# Modelo de Tokenomía OXO

## Visión General

El sistema OXO implementa un modelo de distribución de tokens OXS a través del tiempo que premia la participación a largo plazo y el compromiso con el ecosistema. Este documento explica los principios fundamentales del modelo de tokenomía, cómo se distribuyen los tokens y cómo se determinan las recompensas para los participantes.

## Suministro y Distribución

### Suministro Total

El suministro total de tokens OXS es de **62.5 millones** con 18 decimales.

### Período de Distribución

Los tokens se distribuirán a lo largo de **14 años** (728 semanas), siguiendo una curva logarítmica que garantiza una distribución más alta en las fases iniciales y que va disminuyendo gradualmente.

### Modelo de Distribución Logarítmica

La cantidad de tokens distribuidos cada semana sigue una fórmula logarítmica:

```
tokensSemanales = (TOTAL_SUPPLY / MAX_WEEKS) * ln(semana+5) / ln(250)
```

Este modelo tiene las siguientes características:

- **Distribución inicial más alta**: Las primeras semanas reciben una mayor cantidad de tokens.
- **Disminución gradual**: La cantidad distribuida disminuye con el tiempo, pero nunca llega a cero.
- **Curva suave**: La transición es gradual, evitando cambios bruscos en la distribución.

![Curva de Distribución](https://via.placeholder.com/800x400?text=Curva+de+Distribuci%C3%B3n+OXO)

## Sistema de Pesos

Los tokens se distribuyen entre los usuarios elegibles en función de su peso relativo en el sistema.

### Cálculo de Peso Individual

El peso de cada usuario se calcula mediante la siguiente fórmula:

```
peso = (cantidadStakeada * (100 + duraciónBloqueo) * (100 + productividad)) / 10000
```

Donde:
- **cantidadStakeada**: Cantidad de tokens u otros activos comprometidos por el usuario.
- **duraciónBloqueo**: Tiempo (en semanas) que el usuario se compromete a mantener sus tokens bloqueados (máximo 104 semanas).
- **productividad**: Valor entre 0 y 100 que representa la contribución del usuario al ecosistema.

### Distribución Proporcional

Los tokens asignados a cada usuario para una semana específica se calculan proporcionalmente:

```
tokensUsuario = (tokensSemanales * pesoUsuario) / pesoTotalSistema
```

### Ejemplo Práctico

Supongamos un escenario donde:
- Tokens distribuidos para la semana: 100,000 OXS
- Peso total del sistema: 1,000,000
- Usuario A con peso: 100,000 (10% del peso total)
- Usuario B con peso: 50,000 (5% del peso total)

Entonces:
- Usuario A recibiría: 100,000 * 100,000 / 1,000,000 = 10,000 OXS
- Usuario B recibiría: 100,000 * 50,000 / 1,000,000 = 5,000 OXS

## Factores que Influyen en las Recompensas

### 1. Cantidad Stakeada

Cuantos más tokens u otros activos comprometa un usuario, mayor será su peso y, por tanto, mayor será su parte de la distribución semanal.

**Ejemplo**:
- Usuario con 1,000 tokens stakeados, productividad 50, duración 26 semanas:
  - Peso = 1,000 * (100 + 26) * (100 + 50) / 10000 = 1,890
- Usuario con 2,000 tokens stakeados (el doble), misma productividad y duración:
  - Peso = 2,000 * (100 + 26) * (100 + 50) / 10000 = 3,780 (exactamente el doble)

### 2. Duración del Bloqueo

Comprometerse a un período de bloqueo más largo aumenta el peso del usuario, incentivando la participación a largo plazo.

**Ejemplo**:
- Usuario con 1,000 tokens stakeados, productividad 50, duración 26 semanas:
  - Peso = 1,000 * (100 + 26) * (100 + 50) / 10000 = 1,890
- El mismo usuario aumentando la duración a 52 semanas:
  - Peso = 1,000 * (100 + 52) * (100 + 50) / 10000 = 2,280 (21% más de peso)

### 3. Productividad

La productividad representa la contribución del usuario al ecosistema y puede aumentar significativamente su peso.

**Ejemplo**:
- Usuario con 1,000 tokens stakeados, productividad 50, duración 26 semanas:
  - Peso = 1,000 * (100 + 26) * (100 + 50) / 10000 = 1,890
- El mismo usuario con productividad 75:
  - Peso = 1,000 * (100 + 26) * (100 + 75) / 10000 = 2,205 (17% más de peso)

## Casos de Uso Especiales

### Finalización Anticipada de Staking

Si un usuario finaliza su staking antes de lo comprometido, seguirá manteniendo los tokens ya reclamados, pero no podrá reclamar tokens adicionales a menos que inicie un nuevo período de staking.

### Reclamos Pendientes

Los usuarios pueden reclamar sus tokens en cualquier momento después de la distribución. No hay plazo máximo para reclamar, lo que permite a los usuarios acumular reclamos y procesarlos cuando sea más conveniente para ellos.

### Pausa de Emergencia

En caso de emergencia, el sistema puede ser pausado temporalmente. Durante este tiempo, las distribuciones y reclamos se detendrán, pero se reanudarán una vez que se levante la pausa.

## Consideraciones Económicas

### Inflación Controlada

La distribución logarítmica asegura que la mayor parte de los tokens se distribuyan en las fases iniciales, con una tasa de inflación decreciente a lo largo del tiempo.

### Incentivos para Participación Temprana

Los primeros participantes recibirán mayores recompensas, incentivando la adopción temprana.

### Compromiso a Largo Plazo

El modelo de peso favorece a los usuarios que se comprometen por períodos más largos, fomentando la estabilidad del ecosistema.

## Gobernanza Futura

El modelo actual de tokenomía está diseñado para los primeros 14 años del proyecto. Después de este período, se podría implementar un modelo de gobernanza descentralizada donde los poseedores de tokens OXS puedan votar sobre cambios en la tokenomía o nuevas iniciativas.

---

Para más información sobre el modelo de tokenomía o para consultas específicas, contacta con el equipo de OXO a través de los canales oficiales. 