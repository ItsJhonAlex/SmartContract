# OXO Yield Farming Contract System

Sistema de Yield Farming avanzado con pools de liquidez, rewards dinámicos y progresión exponencial integrada con Staking y Tier System.

## 🌟 Características Principales

- **Pools de Liquidez Múltiples**: Soporte para múltiples pares de tokens con rewards diferenciados
- **Rewards Dinámicos**: Multiplicadores basados en Tier del usuario y tiempo de farming
- **Integración con Staking**: Bonificaciones adicionales para usuarios que también hacen staking
- **Progresión Exponencial**: Sistema de recompensas que mejora con el tiempo usando la misma fórmula que Staking/Tier
- **Auto-Compounding**: Opción de reinversión automática de rewards
- **Fee Structure**: Sistema de fees dinámico basado en tiempo de participación
- **Administración Avanzada**: Gestión flexible de pools, rewards y emergency functions

## 🏗️ Arquitectura del Sistema

### Integración con Ecosistema OXO

```oxo
OXS Token (ERC-20)
    ↓
┌─────────────────────────────────────────────────────────┐
│                 OXO Ecosystem                           │
├─────────────────┬─────────────────┬─────────────────────┤
│  Staking System │   Tier System   │  Yield Farming      │
│                 │                 │                     │
│  • Logarithmic  │  • 3 Tiers      │  • Multiple Pools   │
│    Distribution │  • Dynamic Rate │  • Dynamic Rewards  │
│  • Weekly       │  • Exponential  │  • Tier Multipliers │
│    Rewards      │    Progression  │  • Auto-Compound   │
└─────────────────┴─────────────────┴─────────────────────┘
```

### Sistema de Multiplicadores

- **Base APY**: Rendimiento base de cada pool
- **Tier Multiplier**: 1.0x a 2.5x basado en Tier del usuario
- **Staking Bonus**: +25% si el usuario también hace staking
- **Time Bonus**: Progresión exponencial basada en tiempo de farming
- **Loyalty Bonus**: Bonificación adicional por fidelidad

## 📊 Pools de Liquidez Disponibles

| Pool | Par de Tokens | Base APY | Multiplier Max | Estado |
|------|---------------|----------|----------------|--------|
| 1 | OXS/USDC | 45% | 2.5x | Activo |
| 2 | OXS/MATIC | 35% | 2.2x | Activo |
| 3 | OXS/ETH | 55% | 3.0x | Próximamente |

## 🎯 Cálculo de Rewards

### Fórmula Principal

```math
Total Rewards = Base Rewards × Tier Multiplier × Time Bonus × Staking Bonus × Pool Multiplier
```

### Componentes

- **Base Rewards**: `(Liquidity × Base APY × Time) / 365 days`
- **Tier Multiplier**: Basado en Tier actual del usuario (1.0x - 2.5x)
- **Time Bonus**: Progresión exponencial C(t) = e^(-λ·(104 - t))
- **Staking Bonus**: 1.25x si usuario tiene staking activo
- **Pool Multiplier**: Factor específico de cada pool

## 💰 Sistema de Fees

### Fee Structure Dinámico

```fee
Fee(t) = Initial_Fee - ((Initial_Fee - Final_Fee) × t / Max_Time)
```

**Ejemplo**:

- Fee inicial: 3.0%
- Fee final: 0.5%
- Reducción lineal durante 52 semanas

### Tipos de Fees

- **Deposit Fee**: Fee al depositar liquidez (0.1% - 0.5%)
- **Withdrawal Fee**: Fee dinámico al retirar (3.0% → 0.5%)
- **Performance Fee**: 10% de los rewards generados
- **Emergency Fee**: 5% en caso de retiro de emergencia

## 🚀 Requisitos del Sistema

- **Node.js**: v16.x o superior
- **PNPM**: v8.x o superior (preferido sobre npm/yarn)
- **Truffle**: v5.8.x
- **Solidity**: v0.8.29
- **Ganache**: v7.x o superior
- **Web3.js**: v1.9.x

Verificar versiones instaladas:

```bash
node -v
pnpm -v
npx truffle version
```

## 📦 Instalación

1. **Clonar e instalar dependencias**:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd OXO_YildFarmingContract
   pnpm install
   ```

2. **Compilar contratos**:

   ```bash
   npx truffle compile
   ```

3. **Configurar entorno**:

   ```bash
   cp .env.example .env
   # Editar .env con tus claves
   ```

## 🔧 Configuración del Entorno

Crear archivo `.env` con las siguientes variables:

```env
# Wallet Configuration
MNEMONIC=your_twelve_word_mnemonic_phrase_here

# Network URLs
RPC_URL_POLYGON=https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID
RPC_URL_MUMBAI=https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID

# API Keys
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Contract Addresses (después del deploy)
OXS_TOKEN_ADDRESS=0x...
STAKING_CONTRACT_ADDRESS=0x...
TIER_CONTRACT_ADDRESS=0x...
```

## 🧪 Testing

### Preparación

1. **Instalar dependencias de testing**:

   ```bash
   pnpm install --save-dev @openzeppelin/test-helpers chai chai-as-promised
   ```

2. **Iniciar Ganache**:

   ```bash
   npx ganache --deterministic
   ```

### Ejecutar Tests

```bash
# Todos los tests
npx truffle test

# Test específico
npx truffle test ./test/OXSYieldFarming.test.js

# Tests con coverage
npx truffle run coverage
```

## 🌐 Despliegue

### Mumbai Testnet

```bash
# Deploy en testnet
npx truffle migrate --network mumbai

# Verificar contratos
npx truffle run verify OXSYieldFarming --network mumbai
```

### Polygon Mainnet

```bash
# Deploy en mainnet (¡PRECAUCIÓN!)
npx truffle migrate --network polygon

# Verificar contratos
npx truffle run verify OXSYieldFarming --network polygon
```

## 🔗 Interacción con Contratos

### Usando Truffle Console

```javascript
// Conectar a la red
npx truffle console --network development

// Obtener instancias de contratos
const farming = await OXSYieldFarming.deployed()
const token = await OXSToken.deployed()

// Crear un nuevo pool
await farming.createPool(
  "0xToken1Address",  // Token A
  "0xToken2Address",  // Token B
  web3.utils.toWei("1000000"), // Max liquidity
  4500, // 45% base APY
  250,  // 2.5x max multiplier
  true  // Pool activo
)

// Depositar liquidez
await farming.depositLiquidity(
  0, // Pool ID
  web3.utils.toWei("1000"), // Token A amount
  web3.utils.toWei("500")   // Token B amount
)

// Reclamar rewards
await farming.claimRewards(0) // Pool ID

// Ver información del usuario
const userInfo = await farming.getUserPoolInfo(accounts[0], 0)
console.log("User liquidity:", userInfo.liquidityAmount.toString())
console.log("Pending rewards:", userInfo.pendingRewards.toString())
```

## 📁 Estructura del Proyecto

```estructure
OXO_YildFarmingContract/
├── contracts/
│   ├── farming/
│   │   ├── OXSYieldFarming.sol      # Contrato principal
│   │   └── LiquidityPool.sol        # Gestión de pools
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
│   │   
