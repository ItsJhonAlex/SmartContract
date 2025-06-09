# 🌐 GUÍA DE SETUP PARA SEPOLIA TESTNET

¡Guía paso a paso para deployar tu ecosistema DeFi OXS en Sepolia! 🚀

## 📋 **PREREQUISITOS**

### 1. 🦊 **MetaMask Wallet**
- Instalar [MetaMask](https://metamask.io/)
- Crear/importar wallet
- Agregar red Sepolia si no está

### 2. 🔑 **Infura Account**
- Registrarse en [Infura Dashboard](https://dashboard.infura.io/)
- Crear API Key
- Habilitar **Ethereum Sepolia** en el API Key

### 3. 💰 **Sepolia ETH**
- Obtener ETH de testnet para gas fees
- Necesitas aproximadamente **0.2-0.5 Sepolia ETH**

---

## 🚀 **PASO 1: OBTENER INFURA API KEY**

### Ir a Infura Dashboard:
1. Ve a [https://dashboard.infura.io](https://dashboard.infura.io)
2. Crea una cuenta o inicia sesión
3. Click en **"Create New API Key"**
4. Nombra tu proyecto (ej: "OXS DeFi Ecosystem")
5. **IMPORTANTE**: Habilita **Ethereum Sepolia** en endpoints
6. Copia tu **API Key**

### Ejemplo de API Key:
```
abc123def456ghi789jkl012mno345pq
```

---

## 🔐 **PASO 2: OBTENER PRIVATE KEY**

### Desde MetaMask:
1. Abre MetaMask
2. Click en los 3 puntos → **Account details**
3. Click en **Export Private Key**
4. Ingresa tu contraseña
5. **Copia la private key** (empieza con 0x...)

### ⚠️ **IMPORTANTE DE SEGURIDAD:**
- **NUNCA** compartas tu private key
- **NUNCA** la subas a GitHub
- Úsala solo para testing en testnet
- Para mainnet, usa hardware wallets

---

## 💰 **PASO 3: OBTENER SEPOLIA ETH**

### Faucets recomendados:

#### 🌟 **Opción 1: Infura Faucet (Recomendado)**
- URL: [https://dashboard.infura.io/faucet](https://dashboard.infura.io/faucet)
- Requiere: Cuenta de Infura
- Cantidad: 0.5 ETH por día

#### 🔄 **Opción 2: Faucets Community**
- [https://faucets.io/](https://faucets.io/)
- [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
- [https://sepolia-faucet.pk910.de/](https://sepolia-faucet.pk910.de/)

#### 📱 **Opción 3: Alchemy Faucet**
- URL: [https://sepoliafaucet.net/](https://sepoliafaucet.net/)
- Requiere: Cuenta de Alchemy

### Verificar balance:
1. En MetaMask, cambia a red **Sepolia**
2. Deberías ver tu balance de Sepolia ETH

---

## ⚙️ **PASO 4: CONFIGURAR VARIABLES DE ENTORNO**

### Editar archivo `.env`:

```bash
# 🔑 REEMPLAZA CON TUS VALORES REALES
INFURA_PROJECT_ID=abc123def456ghi789jkl012mno345pq
DEPLOYER_PRIVATE_KEY=0x1234567890abcdef...

# 🔍 OPCIONAL: Etherscan API (para verificar contratos)
ETHERSCAN_API_KEY=tu_etherscan_api_key_aqui
```

### ✅ **Verificar configuración:**
```bash
# Verificar que las variables están configuradas
cat .env | grep -E "(INFURA_PROJECT_ID|DEPLOYER_PRIVATE_KEY)"
```

---

## 🚀 **PASO 5: EJECUTAR DEPLOYMENT**

### Compilar contratos:
```bash
npm run compile:all
```

### Deploy en Sepolia:
```bash
npm run deploy:sepolia
```

### Ejemplo de output esperado:
```
🌐 Configurando deployment para Sepolia...
✅ Configuración validada
📍 Deployer: 0x742d35Cc6665C0532...
🌐 Network: Sepolia Testnet
⛽ Gas Price: 20 gwei

💰 Verificando balance...
💳 Balance: 0.4521 Sepolia ETH

🌟 ¡Iniciando deployment del ecosistema OXS en Sepolia!
===========================================================

📊 FASE 1: TOKEN PRINCIPAL
🚀 Deployando MockERC20...
  ⛽ Gas estimado: 1,234,567
  ✅ MockERC20 deployado en: 0x1234...
  🔗 Explorer: https://sepolia.etherscan.io/address/0x1234...

[... más deployments ...]

🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE EN SEPOLIA!
```

---

## 📊 **PASO 6: VERIFICAR DEPLOYMENT**

### Después del deployment exitoso:

#### ✅ **Contratos deployados:**
- OXS Token: `0x...`
- Staking Contract: `0x...`  
- Tier Contract: `0x...`
- Yield Farming: `0x...`

#### 🔗 **Links útiles:**
- **Sepolia Explorer**: [https://sepolia.etherscan.io](https://sepolia.etherscan.io)
- **Network Stats**: [https://sepolia.dev](https://sepolia.dev)

### 🧪 **Testing en Sepolia:**
```bash
# Ejecutar tests de integración contra Sepolia
npm run test:integration-sepolia
```

---

## 🛠️ **TROUBLESHOOTING**

### ❌ **Error: "INFURA_PROJECT_ID no configurado"**
- Verifica que el API Key esté en `.env`
- Asegúrate de que no tenga espacios extra
- Verifica que Sepolia esté habilitado en Infura

### ❌ **Error: "Balance insuficiente"**
- Obtén más Sepolia ETH de los faucets
- Necesitas al menos 0.1 ETH para deployment

### ❌ **Error: "Private key invalid"**
- Verifica que la private key empiece con `0x`
- Asegúrate de copiarla completa desde MetaMask

### ❌ **Error: "Network not available"**
- Verifica tu conexión a internet
- Revisa el status de Infura: [status.infura.io](https://status.infura.io)

---

## 🎯 **PRÓXIMOS PASOS**

### Después del deployment exitoso:

1. **🔍 Verificar contratos** en Etherscan
2. **🧪 Ejecutar tests** de integración
3. **📱 Conectar frontend** a Sepolia
4. **👥 Invitar beta testers**
5. **🎨 Crear documentación** para usuarios

### **📢 Compartir tu proyecto:**
```markdown
🌟 ¡Mi ecosistema DeFi está live en Sepolia!

🏦 Staking: https://sepolia.etherscan.io/address/0x...
🏆 Tiers: https://sepolia.etherscan.io/address/0x...
🌾 Yield Farming: https://sepolia.etherscan.io/address/0x...

¡Pruébenlo y dejen feedback! 🚀
```

---

## 🆘 **SOPORTE**

Si tienes problemas:

1. **Revisa los logs** del deployment
2. **Verifica las variables** de entorno
3. **Confirma balance** de Sepolia ETH
4. **Checa el status** de Infura/Sepolia

¡Tu ecosistema DeFi estará funcionando en Sepolia en minutos! 🎉 