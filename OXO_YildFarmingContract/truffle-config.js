/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation, and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * https://trufflesuite.com/docs/truffle/reference/configuration
 *
 * OXO Yield Farming Contract Configuration
 * ========================================
 * 
 * Sistema de Yield Farming con pools de liquidez y rewards dinámicos
 * Integrado con Staking y Tier System para maximizar rewards
 * Compatible con Polygon mainnet y Mumbai testnet
 */

require('dotenv').config();
const { MNEMONIC, POLYGONSCAN_API_KEY, RPC_URL_POLYGON, RPC_URL_MUMBAI } = process.env;

const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a managed Ganache instance for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Local development network using external Ganache
    development: {
      host: "127.0.0.1",     // Localhost
      port: 8545,            // Port de Ganache
      network_id: "*",       // Any network
      gas: 6721975,          // Gas limit
      gasPrice: 20000000000  // 20 Gwei
    },
    
    // Polygon Mumbai Testnet
    mumbai: {
      provider: () => new HDWalletProvider(
        MNEMONIC, 
        RPC_URL_MUMBAI || "https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID"
      ),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      gas: 6000000,
      gasPrice: 35000000000, // 35 Gwei
    },
    
    // Polygon Mainnet
    polygon: {
      provider: () => new HDWalletProvider(
        MNEMONIC, 
        RPC_URL_POLYGON || "https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID"
      ),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      gas: 6000000,
      gasPrice: 100000000000, // 100 Gwei
    },
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.29",      // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: true,
         runs: 200
       },
       viaIR: true,        // Habilita IR para evitar "Stack too deep" errors en yield farming
       evmVersion: "istanbul"
      }
    }
  },

  // Los plugins para verificar contratos en Polygonscan
  plugins: [
    'truffle-plugin-verify'
  ],
  
  // Configuración para la verificación de contratos
  api_keys: {
    polygonscan: POLYGONSCAN_API_KEY
  }
}; 