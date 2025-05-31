# OXO Smart Contract System

Sistema de staking con distribución semanal logarítmica y token ERC-20 independiente.

## Características

- **Token Independiente**: Token ERC-20 estándar "Osiris Token" (OXS) separado del contrato de staking.
- **Distribución Logarítmica**: Tokens se distribuyen semanalmente siguiendo la fórmula `LN(semana+5)/LN(250)`.
- **Sistema de Pesos Proporcionales**: Los usuarios reciben tokens en proporción a su peso, calculado por una combinación de:
  - Cantidad de tokens OXS depositados
  - Productividad individual (0-100%)
  - Duración del bloqueo (tiempo de staking)
- **Administración**: Funciones para gestionar usuarios elegibles y manejar situaciones de emergencia.
- **Transparencia**: Seguimiento detallado de distribuciones, reclamos y métricas de usuario.
- **Despliegue en Polygon**: Configurado para despliegue en la mainnet y testnet de Polygon.

## Requisitos del Sistema

- **Node.js**: v16.x o superior
- **npm**: v8.x o superior
- **Truffle**: v5.8.x
- **Solidity**: v0.8.29
- **Ganache**: v7.x o superior
- **Web3.js**: v1.9.x

Puedes verificar las versiones instaladas con los siguientes comandos:

```bash
node -v
npm -v
npx truffle version
```

## Instalación

1. Clona este repositorio:

   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd OXO_SmartContrat
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Compila los contratos:

   ```bash
   npx truffle compile
   ```

## Configuración del Entorno

1. Crea un archivo `.env` en la raíz del proyecto basado en `.env.example`:

   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus claves privadas y URLs de RPC:

   ```env
   MNEMONIC=tus_12_palabras_de_seed_separadas_por_espacios
   RPC_URL_POLYGON=https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID
   RPC_URL_MUMBAI=https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID
   POLYGONSCAN_API_KEY=tu_clave_api_de_polygonscan
   ```

## Pruebas

### Preparación para Pruebas

1. Asegúrate de tener instaladas todas las dependencias:

   ```bash
   npm install --save-dev @openzeppelin/test-helpers chai chai-as-promised
   ```

2. Inicia Ganache (en una terminal separada):

   ```bash
   npx ganache --deterministic
   ```

### Ejecutar las Pruebas

1. Ejecuta todas las pruebas:

   ```bash
   npx truffle test
   ```

2. Ejecuta pruebas específicas:

   ```bash
   npx truffle test ./test/OXSStaking.test.js
   ```

## Despliegue

### Redes de Prueba (Mumbai Testnet)

1. Asegúrate de tener fondos en la red Mumbai (puedes obtenerlos de faucets):

   ```bash
   npx truffle migrate --network mumbai
   ```

2. Verificar el contrato en Polygonscan:

   ```bash
   npx truffle run verify OXSToken OXSStaking --network mumbai
   ```

### Red Principal (Polygon Mainnet)

1. Ejecutar la migración a la red principal (con extrema precaución):

   ```bash
   npx truffle migrate --network polygon
   ```

2. Verificar el contrato en Polygonscan:

   ```bash
   npx truffle run verify OXSToken OXSStaking --network polygon
   ```

## Interacción con el Contrato

### Usando Truffle Console

1. Conecta a la red deseada:

   ```bash
   npx truffle console --network development
   ```

2. Interactúa con los contratos desplegados:

   ```javascript
   // Obtener las instancias de los contratos
   const token = await OXSToken.deployed()
   const staking = await OXSStaking.deployed()
   
   // Ejemplos de interacción con el token
   const owner = await token.owner()
   const totalSupply = await token.TOTAL_SUPPLY()
   
   // Transferir tokens al contrato de staking (necesario antes de distribuir)
   await token.transfer(staking.address, web3.utils.toWei("10000000"), {from: owner})
   
   // Ejemplos de interacción con el staking
   const currentWeek = await staking.getCurrentWeek()
   
   // Distribuir tokens (solo owner)
   await staking.distributeWeeklyTokens({from: owner})
   
   // Añadir un usuario elegible (solo owner)
   await staking.addEligibleClaimer(
     "0xusuario",
     web3.utils.toWei("1000"), // stakedAmount
     50,                       // productivity
     26                        // lockDuration
   )
   ```

## Estructura del Proyecto

El proyecto sigue una arquitectura modular:

- `/contracts/token/OXSToken.sol`: Implementación del token ERC-20 independiente
- `/contracts/staking/OXSStaking.sol`: Contrato principal de staking que utiliza el token
- `/contracts/modules/`: Componentes modulares con funcionalidades específicas
  - `BaseModule.sol`: Variables compartidas entre módulos
  - `UserManagement.sol`: Gestión de usuarios y pesos
  - `Distribution.sol`: Distribución logarítmica de tokens
  - `ClaimLogic.sol`: Lógica de reclamación de tokens
  - `Emergency.sol`: Funciones de emergencia
  - `TimeGuard.sol`: Protección contra manipulaciones temporales
  - `ReentrancyGuard.sol`: Protección contra ataques de reentrancia
- `/contracts/libraries/`: Bibliotecas de utilidades
  - `DateTimeLib.sol`: Cálculos relacionados con fechas y tiempos
  - `LogarithmLib.sol`: Implementación eficiente de cálculos logarítmicos
- `/contracts/interfaces/`: Interfaces para los diferentes módulos

## Documentación

Para documentación más detallada, consulta:

- [Documentación Técnica](./docs/technical/)
- [Guía de Usuario](./docs/user/)
- [Verificación y Seguridad](./docs/verification.md)

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
