# 🌟 OXS DeFi Ecosystem - Guía Completa de Deployment

¡Bienvenido a la guía step-by-step para deployar el ecosistema completo de OXS DeFi! Esta guía te llevará desde cero hasta tener todo funcionando en servidor.

## 📋 **Índice**

1. [Pre-requisitos](#pre-requisitos)
2. [Configuración Inicial](#configuración-inicial)
3. [Deployment Local](#deployment-local)
4. [Deployment en Testnet](#deployment-en-testnet)
5. [Tests Exhaustivos](#tests-exhaustivos)
6. [Deployment en Mainnet](#deployment-en-mainnet)
7. [Monitoring y Mantenimiento](#monitoring-y-mantenimiento)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 **Pre-requisitos**

### Software Necesario
```bash
# Node.js v16 o superior
node --version

# NPM o PNPM
pnpm --version

# Git
git --version
```

### Accounts y Keys Necesarias
- **Wallet con fondos** para deployment (ETH para gas)
- **Infura Account** (https://infura.io) o **Alchemy**
- **Etherscan API Key** (para verificación)
- **Hardware wallet** (recomendado para mainnet)

---

## ⚙️ **Configuración Inicial**

### 1. Clonar y Setup del Proyecto
```bash
# En tu directorio del proyecto
cd /path/to/your/SmartContract

# Instalar dependencias principales
pnpm install

# Configurar environment
cp .env.example .env
```

### 2. Configurar Environment Variables
Edita el archivo `.env` con tus datos reales:

```bash
# 🔑 CRITICAL - Nunca subir a git
DEPLOYER_PRIVATE_KEY=0x1234567890...
INFURA_PROJECT_ID=your_infura_id
ETHERSCAN_API_KEY=your_etherscan_key
```

### 3. Compilar Todos los Contratos
```bash
# Compilar todos los proyectos
npm run compile:all

# O individualmente
npm run compile:staking
npm run compile:tier  
npm run compile:yield
```

### 4. Verificar Tests Individuales
```bash
# Ejecutar todos los tests
npm run test:all

# Verificar que todos pasen ✅
```

---

## 🏠 **Deployment Local (Development)**

### 1. Iniciar Ganache Local
```bash
# Terminal 1 - Iniciar blockchain local
npm run setup:ganache

# Dejar corriendo en background
```

### 2. Deploy en Local
```bash
# Terminal 2 - Deploy ecosystem completo
npm run deploy:local

# Deberías ver:
# 🌸 ¡Iniciando deployment del ecosistema OXS DeFi!
# 🪙 Desplegando Mock OXS Token...
# 🏦 Desplegando Staking Contract...
# 🏆 Desplegando Tier Contract...
# 🌾 Desplegando Yield Farming Contract...
# 🎉 ¡Ecosystem desplegado exitosamente!
```

### 3. Verificar Deployment Local
```bash
# Ejecutar tests de integración
npm run integration:test

# Verificar health del ecosystem
npm run verify:contracts
```

**¡Si todo pasa, estás listo para testnet! 🚀**

---

## 🌐 **Deployment en Testnet**

### 1. Preparar Fondos en Testnet

#### Para Sepolia (Ethereum)
- Ir a https://sepoliafaucet.com/
- Conseguir ETH de testnet (~0.5 ETH)
- Verificar balance: https://sepolia.etherscan.io/

#### Para Mumbai (Polygon)
- Ir a https://faucet.polygon.technology/
- Conseguir MATIC de testnet (~1 MATIC)
- Verificar balance: https://mumbai.polygonscan.com/

### 2. Deploy en Sepolia
```bash
# Verificar balance primero
npx truffle console --network sepolia
> web3.eth.getBalance("YOUR_ADDRESS")

# Deploy completo
npm run deploy:sepolia

# Monitorear en: https://sepolia.etherscan.io/
```

### 3. Deploy en Mumbai (Polygon)
```bash
# Deploy en Polygon testnet
npm run deploy:mumbai

# Monitorear en: https://mumbai.polygonscan.com/
```

### 4. Verificar Contratos en Explorer
```bash
# Verificar automáticamente
npm run verify:contracts sepolia

# O manualmente en Etherscan usando:
# - Contract Address
# - Constructor Parameters
# - Compiler Version (0.8.29)
```

---

## 🧪 **Tests Exhaustivos**

### 1. Tests de Integración Completa
```bash
# Ejecutar suite completa de tests
npm run integration:test

# Tests específicos
node scripts/test-staking-integration.js
node scripts/test-tier-integration.js  
node scripts/test-yield-farming-integration.js
```

### 2. Stress Tests
```bash
# Simular carga alta
node scripts/stress-test.js --users=100 --duration=30m

# Test de gas optimization
node scripts/gas-optimization-test.js
```

### 3. Security Audit básico
```bash
# Ejecutar checks de seguridad
npm install -g slither-analyzer
slither OXO_StakingContract/contracts/
slither OXO_TierContract/contracts/
slither OXO_YildFarmingContract/contracts/
```

### 4. Performance Testing
```bash
# Test de performance
node scripts/performance-test.js

# Verificar:
# ✅ Gas costs optimizados
# ✅ Response times < 2s
# ✅ Concurrent users handling
# ✅ Error rates < 0.1%
```

---

## 🚀 **Deployment en Mainnet**

### ⚠️ **CRITICAL CHECKLIST ANTES DE MAINNET**

- [ ] Todos los tests pasan en testnet
- [ ] Security audit completado
- [ ] Multisig wallet configurado
- [ ] Emergency procedures documentadas
- [ ] Team notification setup
- [ ] Backup plans en caso de issues

### 1. Configuración de Seguridad
```bash
# Usar hardware wallet (Ledger/Trezor)
# O configurar multisig con Gnosis Safe

# Variables de mainnet
DEPLOYER_PRIVATE_KEY=hardware_wallet_or_multisig
MAINNET_RPC_URL=https://mainnet.infura.io/v3/...
ETHERSCAN_API_KEY=your_real_api_key
```

### 2. Deploy Gradual en Mainnet
```bash
# Step 1: Deploy solo OXS Token
node scripts/deploy-token-only.js mainnet

# Step 2: Deploy Staking (verificar)
node scripts/deploy-staking-only.js mainnet

# Step 3: Deploy Tier (verificar)
node scripts/deploy-tier-only.js mainnet

# Step 4: Deploy Yield Farming (verificar)
node scripts/deploy-yield-only.js mainnet

# Step 5: Initialize ecosystem
node scripts/initialize-ecosystem.js mainnet
```

### 3. Post-Deployment Verification
```bash
# Verificar todo funciona
npm run verify:contracts mainnet

# Health check completo
npm run health:check mainnet

# Setup monitoring
npm run setup:monitoring mainnet
```

---

## 📊 **Monitoring y Mantenimiento**

### 1. Setup de Monitoring
```bash
# Configurar alerts
node scripts/setup-alerts.js

# Dashboard de métricas
node scripts/setup-dashboard.js

# Notifications (Discord/Telegram)
node scripts/setup-notifications.js
```

### 2. Métricas Clave a Monitorear
- **Gas costs** y optimización
- **Transaction success rate**
- **User activity** (stakes, claims, etc.)
- **TVL (Total Value Locked)**
- **Rewards distribution**
- **Error rates** y failed transactions

### 3. Maintenance Tasks
```bash
# Weekly health check
npm run health:weekly

# Monthly reports
npm run reports:monthly

# Backup important data
npm run backup:data
```

---

## 🔧 **Troubleshooting**

### Errores Comunes

#### 1. "Insufficient funds"
```bash
# Verificar balance
npx truffle console --network sepolia
> web3.eth.getBalance("YOUR_ADDRESS")

# Conseguir más fondos del faucet
```

#### 2. "Contract already deployed"
```bash
# Limpiar builds y re-deployar
rm -rf */build/
npm run compile:all
npm run deploy:local
```

#### 3. "Gas estimation failed"
```bash
# Aumentar gas limit en truffle-config.js
gas: 8000000,
gasPrice: 20000000000 // 20 gwei
```

#### 4. "Library linking failed"
```bash
# Verificar que YieldMath esté deployado primero
# Re-link manualmente si es necesario
```

### Debugging Steps
1. **Verificar logs** detallados
2. **Check block explorer** para transacciones
3. **Revisar gas costs** y limits
4. **Validar contract addresses**
5. **Confirmar network configuration**

---

## 📞 **Soporte y Contacto**

### Documentación Adicional
- [Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Security Best Practices](./docs/SECURITY.md)

### En Caso de Emergencia
1. **Pausar contratos**: `npm run emergency:pause`
2. **Notificar team**: Usar Discord/Telegram alerts
3. **Rollback plan**: Documentado en `./docs/ROLLBACK.md`

---

## ✅ **Checklist Final**

### Pre-Deployment
- [ ] Environment variables configuradas
- [ ] Fondos suficientes en wallet
- [ ] Tests todos pasando
- [ ] Security review completado

### Durante Deployment  
- [ ] Monitorear gas costs
- [ ] Verificar cada step
- [ ] Documentar addresses
- [ ] Backup de configuración

### Post-Deployment
- [ ] Verificar contratos en explorer
- [ ] Tests de integración
- [ ] Setup de monitoring
- [ ] Documentar addresses finales

---

## 🎉 **¡Felicidades!**

¡Si llegaste hasta aquí, tienes tu ecosistema DeFi completamente deployado y funcionando! 

**Próximos pasos:**
1. Configurar frontend con las nuevas addresses
2. Crear pools iniciales
3. ¡Empezar a usar tu DeFi protocol!

¡Tu ecosistema OXS está listo para revolucionar el mundo DeFi! 🌟 