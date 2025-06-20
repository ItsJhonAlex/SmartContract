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
 * OXO Tier Contract Configuration
 * --------------------------------
 * 
 * Sistema de Tiers integrado con progresión exponencial
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
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache, geth, or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    // Local development network
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Port de Ganache
      network_id: "*",       // Any network (default: none)
      gas: 6721975,          // Gas limit
      gasPrice: 20000000000, // 20 gwei
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
       viaIR: true,        // Habilita IR para evitar "Stack too deep" errors
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