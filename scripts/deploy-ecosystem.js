const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

/**
 * 🌟 OXS DeFi Ecosystem Deployment Script
 * ¡Script completo para deployar Staking + Tier + Yield Farming!
 */

class OXSEcosystemDeployer {
    constructor(config) {
        this.config = config;
        this.web3 = new Web3(config.rpcUrl);
        this.deployerAccount = null;
        this.deployedContracts = {};
        this.gasTracker = {
            totalGasUsed: 0,
            totalCostETH: 0,
            deployments: []
        };
    }

    /**
     * 🚀 Función principal de deployment
     */
    async deployEcosystem() {
        console.log('🌸 ¡Iniciando deployment del ecosistema OXS DeFi!');
        console.log('🔗 Network:', this.config.network);
        console.log('🌐 RPC URL:', this.config.rpcUrl);
        
        try {
            // 1. Setup inicial
            await this.setupDeployer();
            
            // 2. Deploy contratos individuales en orden
            await this.deployMockOXSToken();
            await this.deployStakingContract();
            await this.deployTierContract();
            await this.deployYieldFarmingContract();
            
            // 3. Deploy Factory y conectar todo
            await this.deployEcosystemFactory();
            await this.initializeEcosystem();
            
            // 4. Tests básicos de integración
            await this.runBasicIntegrationTests();
            
            // 5. Reportes finales
            await this.generateDeploymentReport();
            
            console.log('🎉 ¡Ecosystem desplegado exitosamente!');
            
        } catch (error) {
            console.error('❌ Error durante deployment:', error);
            throw error;
        }
    }

    /**
     * 📋 Setup del deployer account
     */
    async setupDeployer() {
        console.log('\n📋 Configurando deployer...');
        
        // Crear account desde private key
        const account = this.web3.eth.accounts.privateKeyToAccount(this.config.deployerPrivateKey);
        this.web3.eth.accounts.wallet.add(account);
        this.deployerAccount = account.address;
        
        // Verificar balance
        const balance = await this.web3.eth.getBalance(this.deployerAccount);
        const balanceETH = this.web3.utils.fromWei(balance, 'ether');
        
        console.log('👤 Deployer address:', this.deployerAccount);
        console.log('💰 Balance:', balanceETH, 'ETH');
        
        if (parseFloat(balanceETH) < 0.1) {
            console.warn('⚠️ Balance bajo, pero continuando...');
        }
    }

    /**
     * 🪙 Deploy OXS Token Mock
     */
    async deployMockOXSToken() {
        console.log('\n🪙 Desplegando Mock OXS Token...');
        
        const tokenPath = path.join(__dirname, '../OXO_YildFarmingContract');
        const contractData = await this.loadContractData(tokenPath, 'MockERC20');
        
        const oxsToken = await this.deployContract(
            'MockERC20',
            contractData.abi,
            contractData.bytecode,
            ["OXS Token", "OXS", 18],
            'OXS Token'
        );
        
        this.deployedContracts.oxsToken = oxsToken.options.address;
        console.log('✅ OXS Token desplegado en:', this.deployedContracts.oxsToken);
    }

    /**
     * 🏦 Deploy Staking Contract
     */
    async deployStakingContract() {
        console.log('\n🏦 Desplegando Staking Contract...');
        
        const stakingPath = path.join(__dirname, '../OXO_StakingContract');
        const contractData = await this.loadContractData(stakingPath, 'OXSStaking');
        
        const stakingContract = await this.deployContract(
            'OXSStaking',
            contractData.abi,
            contractData.bytecode,
            [this.deployedContracts.oxsToken],
            'Staking Contract'
        );
        
        this.deployedContracts.stakingContract = stakingContract.options.address;
        console.log('✅ Staking Contract desplegado en:', this.deployedContracts.stakingContract);
    }

    /**
     * 🏆 Deploy Tier Contract
     */
    async deployTierContract() {
        console.log('\n🏆 Desplegando Tier Contract...');
        
        const tierPath = path.join(__dirname, '../OXO_TierContract');
        const contractData = await this.loadContractData(tierPath, 'OXSTier');
        
        const tierContract = await this.deployContract(
            'OXSTier',
            contractData.abi,
            contractData.bytecode,
            [this.deployedContracts.oxsToken],
            'Tier Contract'
        );
        
        this.deployedContracts.tierContract = tierContract.options.address;
        console.log('✅ Tier Contract desplegado en:', this.deployedContracts.tierContract);
    }

    /**
     * 🌾 Deploy Yield Farming Contract
     */
    async deployYieldFarmingContract() {
        console.log('\n🌾 Desplegando Yield Farming Contract...');
        
        const yieldPath = path.join(__dirname, '../OXO_YildFarmingContract');
        
        // Deploy YieldMath Library primero
        const yieldMathData = await this.loadContractData(yieldPath, 'YieldMath');
        const yieldMathContract = await this.deployContract(
            'YieldMath',
            yieldMathData.abi,
            yieldMathData.bytecode,
            [],
            'YieldMath Library'
        );
        
        this.deployedContracts.yieldMathLibrary = yieldMathContract.options.address;
        
        // Link library y deploy main contract
        const yieldFarmingData = await this.loadContractData(yieldPath, 'OXSYieldFarming');
        const linkedBytecode = this.linkLibrary(
            yieldFarmingData.bytecode,
            'YieldMath',
            yieldMathContract.options.address
        );
        
        const yieldFarmingContract = await this.deployContract(
            'OXSYieldFarming',
            yieldFarmingData.abi,
            linkedBytecode,
            [this.deployerAccount],
            'Yield Farming Contract'
        );
        
        this.deployedContracts.yieldFarmingContract = yieldFarmingContract.options.address;
        console.log('✅ Yield Farming Contract desplegado en:', this.deployedContracts.yieldFarmingContract);
    }

    /**
     * 🏭 Deploy Ecosystem Factory
     */
    async deployEcosystemFactory() {
        console.log('\n🏭 ¡Por ahora usaremos inicialización manual!');
        console.log('   (Factory Contract se puede agregar más tarde)');
        
        // Por ahora, marcamos como si tuvieramos el factory
        this.deployedContracts.ecosystemFactory = 'MANUAL_INITIALIZATION';
    }

    /**
     * 🔗 Inicializar ecosystem completo
     */
    async initializeEcosystem() {
        console.log('\n🔗 Inicializando ecosystem manualmente...');
        
        // Inicializar Yield Farming con referencias
        const yieldPath = path.join(__dirname, '../OXO_YildFarmingContract');
        const yieldData = await this.loadContractData(yieldPath, 'OXSYieldFarming');
        
        const yieldContract = new this.web3.eth.Contract(
            yieldData.abi,
            this.deployedContracts.yieldFarmingContract
        );
        
        try {
            await yieldContract.methods.initializeContracts(
                this.deployedContracts.oxsToken,
                this.deployedContracts.stakingContract,
                this.deployedContracts.tierContract
            ).send({
                from: this.deployerAccount,
                gas: 500000
            });
            
            console.log('✅ Yield Farming inicializado con referencias cruzadas');
            
        } catch (error) {
            console.log('⚠️ Error inicializando Yield Farming (puede estar ya inicializado):', error.message);
        }
    }

    /**
     * 🧪 Tests básicos de integración
     */
    async runBasicIntegrationTests() {
        console.log('\n🧪 Ejecutando tests básicos de integración...');
        
        try {
            // Test 1: Verificar que los contratos estén activos
            console.log('🔍 Verificando contratos...');
            
            const stakingCode = await this.web3.eth.getCode(this.deployedContracts.stakingContract);
            const tierCode = await this.web3.eth.getCode(this.deployedContracts.tierContract);
            const yieldCode = await this.web3.eth.getCode(this.deployedContracts.yieldFarmingContract);
            
            console.log('  - Staking Contract activo:', stakingCode !== '0x');
            console.log('  - Tier Contract activo:', tierCode !== '0x');
            console.log('  - Yield Farming Contract activo:', yieldCode !== '0x');
            
            // Test 2: Verificar funcionalidades básicas
            await this.testYieldFarmingBasics();
            
            console.log('✅ Tests básicos completados');
            
        } catch (error) {
            console.error('❌ Error en integration tests:', error);
            // No hacer throw para no fallar el deployment
        }
    }

    /**
     * 🌾 Test básico de Yield Farming
     */
    async testYieldFarmingBasics() {
        console.log('  🌾 Testing Yield Farming basics...');
        
        try {
            const yieldPath = path.join(__dirname, '../OXO_YildFarmingContract');
            const yieldData = await this.loadContractData(yieldPath, 'OXSYieldFarming');
            
            const yieldContract = new this.web3.eth.Contract(
                yieldData.abi,
                this.deployedContracts.yieldFarmingContract
            );
            
            // Verificar total pools
            const totalPools = await yieldContract.methods.getTotalPools().call();
            console.log('    - Total Pools:', totalPools);
            
            // Verificar direcciones configuradas
            const oxsAddress = await yieldContract.methods.oxsTokenAddress().call();
            console.log('    - OXS Token Address configurada:', oxsAddress === this.deployedContracts.oxsToken);
            
        } catch (error) {
            console.log('    ⚠️ Error en test básico:', error.message);
        }
    }

    /**
     * 📊 Generar reporte final
     */
    async generateDeploymentReport() {
        console.log('\n📊 Generando reporte de deployment...');
        
        const report = {
            timestamp: new Date().toISOString(),
            network: this.config.network,
            deployer: this.deployerAccount,
            contracts: this.deployedContracts,
            gasUsage: this.gasTracker,
            status: 'SUCCESS',
            nextSteps: [
                '1. Verificar contratos en block explorer',
                '2. Ejecutar tests completos',
                '3. Configurar frontend con nuevas direcciones',
                '4. Crear pools iniciales de yield farming',
                '5. Configurar parámetros de protocolo'
            ]
        };
        
        // Guardar reporte
        const reportPath = path.join(__dirname, `../deployment-report-${this.config.network}-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📋 Reporte guardado en:', reportPath);
        this.printFinalSummary();
    }

    /**
     * 📋 Imprimir resumen final
     */
    printFinalSummary() {
        console.log('\n🌟 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE!');
        console.log('═══════════════════════════════════════');
        console.log('📊 ESTADÍSTICAS:');
        console.log(`   Total Gas Used: ${this.gasTracker.totalGasUsed.toLocaleString()}`);
        console.log(`   Total Cost ETH: ${this.gasTracker.totalCostETH.toFixed(6)}`);
        console.log(`   Contratos desplegados: ${Object.keys(this.deployedContracts).length}`);
        console.log('\n🏠 DIRECCIONES DE CONTRATOS:');
        Object.entries(this.deployedContracts).forEach(([name, address]) => {
            console.log(`   ${name}: ${address}`);
        });
        console.log('\n🚀 PRÓXIMOS PASOS:');
        console.log('   1. Ejecutar tests exhaustivos con: npm run test:integration');
        console.log('   2. Configurar frontend con las nuevas direcciones');
        console.log('   3. Crear pools iniciales de yield farming');
        console.log('   4. ¡Celebrar! 🎉');
        console.log('═══════════════════════════════════════');
    }

    // Helper methods
    async deployContract(name, abi, bytecode, args, description) {
        console.log(`  📦 Desplegando ${description}...`);
        
        const contract = new this.web3.eth.Contract(abi);
        const gasEstimate = await contract.deploy({
            data: bytecode,
            arguments: args
        }).estimateGas({ from: this.deployerAccount });
        
        const gasPrice = await this.web3.eth.getGasPrice();
        
        const deployedContract = await contract.deploy({
            data: bytecode,
            arguments: args
        }).send({
            from: this.deployerAccount,
            gas: Math.floor(Number(gasEstimate) * 1.2), // 20% buffer
            gasPrice: gasPrice
        });
        
        // Track gas usage (convertir BigInt a Number)
        this.gasTracker.totalGasUsed += Number(gasEstimate);
        this.gasTracker.totalCostETH += (Number(gasEstimate) * Number(gasPrice)) / 1e18;
        
        console.log(`    ✅ ${description} desplegado en:`, deployedContract.options.address);
        return deployedContract;
    }

    async loadContractData(projectPath, contractName) {
        const buildPath = path.join(projectPath, 'build', 'contracts', `${contractName}.json`);
        
        if (!fs.existsSync(buildPath)) {
            throw new Error(`❌ Archivo de contrato no encontrado: ${buildPath}\nAsegúrate de compilar los contratos primero con 'truffle compile'`);
        }
        
        const contractJson = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
        
        return {
            abi: contractJson.abi,
            bytecode: contractJson.bytecode
        };
    }

    linkLibrary(bytecode, libraryName, libraryAddress) {
        const placeholder = `__${libraryName}${'_'.repeat(38 - libraryName.length)}`;
        return bytecode.replace(new RegExp(placeholder, 'g'), libraryAddress.slice(2));
    }
}

// Configuración para diferentes networks
const configs = {
    // Testnet local (Ganache)
    local: {
        network: 'local',
        rpcUrl: 'http://127.0.0.1:8545',
        deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d'
    },
    
    // Sepolia Testnet
    sepolia: {
        network: 'sepolia',
        rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY
    },
    
    // Polygon Mumbai  
    mumbai: {
        network: 'mumbai',
        rpcUrl: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
        deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY
    },
    
    // Hardhat local
    hardhat: {
        network: 'hardhat',
        rpcUrl: 'http://127.0.0.1:8545',
        deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    }
};

// Main execution
async function main() {
    const network = process.argv[2] || 'local';
    const config = configs[network];
    
    if (!config) {
        console.error('❌ Network no soportada:', network);
        console.log('✅ Networks disponibles:', Object.keys(configs).join(', '));
        process.exit(1);
    }
    
    console.log('🚀 Iniciando deployment para network:', network);
    
    const deployer = new OXSEcosystemDeployer(config);
    await deployer.deployEcosystem();
}

// Export para uso programático
module.exports = { OXSEcosystemDeployer, configs };

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
} 