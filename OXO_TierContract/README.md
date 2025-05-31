# 🎯 OXS Tier System

## 📝 Descripción

El sistema de Tiers de OXS es un contrato inteligente que gestiona los niveles de membresía basados en el stake de tokens OXS. Este sistema permite a los usuarios alcanzar diferentes niveles de beneficios según la cantidad de tokens que mantengan stakeados.

## 🏗️ Arquitectura

### Contratos Principales

- `OXSTier.sol`: Contrato principal que implementa la lógica de gestión de tiers
- `BaseModule.sol`: Módulo base con variables y funciones compartidas
- `TierManagement.sol`: Módulo que implementa la lógica de gestión de tiers

### Interfaces

- `ITierManagement.sol`: Interfaz que define la estructura y funciones del sistema de tiers
- `IOXSTier.sol`: Interfaz principal que hereda de ITierManagement

## 🎮 Funcionalidades

### Tiers Disponibles

1. **Elevator** 🛗
   - Requisito: 2,000 OXS
   - Valor en efectivo: $300
   - Tasa de conversión: 0.01

2. **Premium Elevator** ⭐
   - Requisito: 10,000 OXS
   - Valor en efectivo: $1,500
   - Tasa de conversión: 0.010457249638

3. **VIP ELEVATOR** 👑
   - Requisito: 34,000 OXS
   - Valor en efectivo: $5,100
   - Tasa de conversión: 0.0109354069992

### Características Principales

- Gestión automática de tiers basada en el stake
- Actualización en tiempo real del nivel de membresía
- Sistema de conversión de tokens a valor en efectivo
- Control de acceso basado en roles (owner)
- Eventos para seguimiento de cambios

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]

# Instalar dependencias
npm install

# Compilar contratos
npx truffle compile

# Ejecutar tests
npx truffle test
```

## 📋 Requisitos

- Node.js >= 14
- Truffle >= 5.5.0
- Solidity >= 0.8.29

## 🔧 Configuración

### Variables de Entorno

Crear un archivo `.env` con las siguientes variables:

```env
PRIVATE_KEY=tu_clave_privada
INFURA_KEY=tu_clave_infura
```

### Redes

El contrato está configurado para desplegarse en:

- Red de desarrollo local
- Testnet (Goerli)
- Mainnet

## 🧪 Testing

Los tests cubren:

- Inicialización del contrato
- Gestión de tiers
- Funciones de owner
- Funciones de consulta
- Casos de error

Para ejecutar los tests:

```bash
npx truffle test
```

## 📊 Despliegue

### Red Local

```bash
npx truffle migrate --network development
```

### Testnet

```bash
npx truffle migrate --network goerli
```

### Mainnet

```bash
npx truffle migrate --network mainnet
```

## 🔐 Seguridad

- Controles de acceso implementados
- Validación de entradas
- Manejo seguro de tokens
- Eventos para auditoría

## 📈 Uso

### Actualizar Tier de Usuario

```javascript
await tierContract.updateUserTier(userAddress, stakedAmount);
```

### Consultar Tier Actual

```javascript
const userInfo = await tierContract.getUserTierInfo(userAddress);
```

### Añadir Nuevo Tier (Owner)

```javascript
await tierContract.addTier(
  "Nuevo Tier",
  requiredTokens,
  cashValue,
  conversionRate
);
```

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 👥 Autores

- **Jonathan Alejandro Rodriguez Lopes** - *Desarrollo* - [@ItsJhonAlex](https://github.com/ItsJhonAlex)

## 🙏 Agradecimientos

- OpenZeppelin por sus contratos base
- La comunidad de Ethereum por su soporte
- Todos los contribuidores del proyecto
