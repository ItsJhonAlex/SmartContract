/**
 * Archivo de configuración de ejemplo para Truffle
 * Para usar, copiar a truffle-config.js y completar con tus propios valores
 */

require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Si no tienes un archivo .env, define estas variables aquí
const MNEMONIC = process.env.MNEMONIC || "";
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

module.exports = {
  /**
   * Directorios del proyecto
   */
  contracts_directory: "./contracts",
  migrations_directory: "./migrations",
  contracts_build_directory: "./build/contracts",
  test_directory: "./test",

  /**
   * Redes
   */
  networks: {
    // Red de desarrollo local
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Cualquier red
      websockets: true,
    },
    
    // Red para coverage y gas-reporter
    development_cli: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    
    // Red Ganache UI
    ganache_ui: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    
    // Testnet - Sepolia
    sepolia: {
      provider: () => new HDWalletProvider(
        MNEMONIC, 
        `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
      ),
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 10000000000, // 10 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    
    // Testnet - Goerli
    goerli: {
      provider: () => new HDWalletProvider(
        MNEMONIC, 
        `https://goerli.infura.io/v3/${INFURA_API_KEY}`
      ),
      network_id: 5,
      gas: 5500000,
      gasPrice: 10000000000, // 10 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    
    // Mainnet
    mainnet: {
      provider: () => new HDWalletProvider(
        MNEMONIC, 
        `https://mainnet.infura.io/v3/${INFURA_API_KEY}`
      ),
      network_id: 1,
      gas: 5500000,
      gasPrice: 50000000000, // 50 gwei (ajustar según condiciones de la red)
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: false,
    },
  },

  /**
   * Configuración del compilador de Solidity
   */
  compilers: {
    solc: {
      version: "0.8.29",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "paris",
      },
    },
  },
  
  /**
   * Plugins
   */
  plugins: [
    'solidity-coverage',
    'truffle-plugin-verify',
    'truffle-gas-reporter'
  ],
  
  /**
   * Configuración del gas-reporter
   */
  gasReporter: {
    enabled: true,
    currency: 'USD',
    gasPrice: 50,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || '',
    outputFile: 'gas-report.txt',
    noColors: true,
    showTimeSpent: true,
    showMethodSig: true,
  },
  
  /**
   * Configuración de verificación de contrato en Etherscan
   */
  verify: {
    api_keys: {
      etherscan: ETHERSCAN_API_KEY,
    },
  },
  
  /**
   * Configuración de Mocha para tests
   */
  mocha: {
    timeout: 100000,
    reporter: 'spec',
  },
}; 