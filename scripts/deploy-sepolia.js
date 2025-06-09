/**
 * 🌐 SEPOLIA DEPLOYMENT SCRIPT
 * ============================
 * 
 * Script optimizado para deployar el ecosistema OXS en Sepolia testnet
 */

require('dotenv').config();
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Configuración específica de Sepolia
const SEPOLIA_CONFIG = {
    networkName: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    gasLimit: 8000000,
    gasPrice: '20000000000', // 20 gwei
    explorerUrl: 'https://sepolia.etherscan.io',
    deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY
};

class SepoliaDeployer {
    constructor() {
        console.log('🌐 Configurando deployment para Sepolia...');
        
        // Validar configuración
        this.validateConfig();
        
        // Configurar Web3
        this.web3 = new Web3(SEPOLIA_CONFIG.rpcUrl);
        this.deployerAccount = this.web3.eth.accounts.privateKeyToAccount(SEPOLIA_CONFIG.deployerPrivateKey);
        this.web3.eth.accounts.wallet.add(this.deployerAccount);
        
        // Tracking
        this.deployedContracts = {};
        this.gasUsed = 0;
        this.totalCost = 0;
        
        console.log('✅ Configuración validada');
        console.log(`📍 Deployer: ${this.deployerAccount.address}`);
        console.log(`🌐 Network: ${SEPOLIA_CONFIG.networkName}`);
        console.log(`⛽ Gas Price: ${SEPOLIA_CONFIG.gasPrice / 1e9} gwei`);
    }

    validateConfig() {
        const errors = [];
        
        if (!process.env.INFURA_PROJECT_ID || process.env.INFURA_PROJECT_ID === 'your_infura_api_key_here') {
            errors.push('❌ INFURA_PROJECT_ID no configurado');
        }
        
        if (!process.env.DEPLOYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY === 'your_private_key_here') {
            errors.push('❌ DEPLOYER_PRIVATE_KEY no configurado');
        }
        
        if (errors.length > 0) {
            console.error('🚨 ERRORES DE CONFIGURACIÓN:');
            errors.forEach(error => console.error(error));
            console.error('\n📋 PARA ARREGLAR:');
            console.error('1. Obtén tu Infura API Key en: https://dashboard.infura.io');
            console.error('2. Exporta tu private key desde MetaMask');
            console.error('3. Actualiza el archivo .env con los valores reales');
            console.error('4. Asegúrate de tener Sepolia ETH en tu wallet');
            process.exit(1);
        }
    }

    async checkBalance() {
        console.log('\n💰 Verificando balance...');
        
        const balance = await this.web3.eth.getBalance(this.deployerAccount.address);
        const balanceEth = this.web3.utils.fromWei(balance, 'ether');
        
        console.log(`💳 Balance: ${balanceEth} Sepolia ETH`);
        
        if (parseFloat(balanceEth) < 0.1) {
            console.error('⚠️ Balance insuficiente!');
            console.error('💡 Obtén Sepolia ETH en:');
            console.error('   - https://faucets.io/');
            console.error('   - https://sepoliafaucet.com/');
            console.error('   - https://sepolia-faucet.pk910.de/');
            process.exit(1);
        }
        
        return parseFloat(balanceEth);
    }

    async deployContract(contractName, projectPath, constructorArgs = []) {
        console.log(`\n🚀 Deployando ${contractName}...`);
        
        const contractPath = path.join(__dirname, '..', projectPath, 'build', 'contracts', `${contractName}.json`);
        
        if (!fs.existsSync(contractPath)) {
            throw new Error(`❌ Contrato ${contractName} no encontrado en ${contractPath}`);
        }
        
        const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        const contract = new this.web3.eth.Contract(contractData.abi);
        
        // Estimar gas
        const gasEstimate = await contract.deploy({
            data: contractData.bytecode,
            arguments: constructorArgs
        }).estimateGas({ from: this.deployerAccount.address });
        
        console.log(`  ⛽ Gas estimado: ${gasEstimate.toLocaleString()}`);
        
        // Deploy
        const deployedContract = await contract.deploy({
            data: contractData.bytecode,
            arguments: constructorArgs
        }).send({
            from: this.deployerAccount.address,
            gas: Math.floor(Number(gasEstimate) * 1.2), // 20% buffer
            gasPrice: SEPOLIA_CONFIG.gasPrice
        });
        
        const gasUsed = deployedContract.options.gasUsed || gasEstimate;
        const cost = (Number(gasUsed) * Number(SEPOLIA_CONFIG.gasPrice)) / 1e18;
        
        this.gasUsed += Number(gasUsed);
        this.totalCost += cost;
        
        console.log(`  ✅ ${contractName} deployado en: ${deployedContract.options.address}`);
        console.log(`  ⛽ Gas usado: ${Number(gasUsed).toLocaleString()}`);
        console.log(`  💰 Costo: ${cost.toFixed(6)} ETH`);
        console.log(`  🔗 Explorer: ${SEPOLIA_CONFIG.explorerUrl}/address/${deployedContract.options.address}`);
        
        this.deployedContracts[contractName] = {
            address: deployedContract.options.address,
            abi: contractData.abi,
            gasUsed: Number(gasUsed),
            cost: cost
        };
        
        return deployedContract;
    }

    async deployEcosystem() {
        console.log('\n🌟 ¡Iniciando deployment del ecosistema OXS en Sepolia!');
        console.log('===========================================================');
        
        try {
            // Verificar balance
            await this.checkBalance();
            
            // 1. Deploy OXS Token (Staking)
            console.log('\n📊 FASE 1: TOKEN PRINCIPAL');
            const oxsToken = await this.deployContract('MockERC20', 'OXO_StakingContract', [
                'OXO Staking Token',
                'OXS',
                process.env.INITIAL_TOKEN_SUPPLY || '1000000000000000000000000000'
            ]);
            
            // 2. Deploy libraries
            console.log('\n📊 FASE 2: LIBRERÍAS');
            const dateTimeLib = await this.deployContract('DateTimeLib', 'OXO_StakingContract');
            const logarithmLib = await this.deployContract('LogarithmLib', 'OXO_StakingContract');
            const yieldMathLib = await this.deployContract('YieldMath', 'OXO_YildFarmingContract');
            
            // 3. Deploy Staking Contract
            console.log('\n📊 FASE 3: STAKING CONTRACT');
            const stakingContract = await this.deployContract('OXSStaking', 'OXO_StakingContract', [
                oxsToken.options.address
            ]);
            
            // 4. Deploy Tier Contract  
            console.log('\n📊 FASE 4: TIER CONTRACT');
            const tierContract = await this.deployContract('OXSTier', 'OXO_TierContract', [
                oxsToken.options.address
            ]);
            
            // 5. Deploy mock tokens para Yield Farming
            console.log('\n📊 FASE 5: TOKENS PARA YIELD FARMING');
            const tokenA = await this.deployContract('MockERC20', 'OXO_YildFarmingContract', [
                'Test Token A',
                'TKA',
                '1000000000000000000000000000'
            ]);
            
            const tokenB = await this.deployContract('MockERC20', 'OXO_YildFarmingContract', [
                'Test Token B', 
                'TKB',
                '1000000000000000000000000000'
            ]);
            
            // 6. Deploy Yield Farming Contract
            console.log('\n📊 FASE 6: YIELD FARMING CONTRACT');
            const yieldFarming = await this.deployContract('OXSYieldFarming', 'OXO_YildFarmingContract');
            
            // 7. Configurar integración
            console.log('\n📊 FASE 7: CONFIGURACIÓN DE INTEGRACIÓN');
            await this.setupIntegration(oxsToken, stakingContract, tierContract, yieldFarming, tokenA, tokenB);
            
            // 8. Crear reporte
            await this.generateReport();
            
            console.log('\n🎉 ¡DEPLOYMENT COMPLETADO EXITOSAMENTE EN SEPOLIA!');
            
        } catch (error) {
            console.error('\n❌ Error durante deployment:', error.message);
            throw error;
        }
    }

    async setupIntegration(oxsToken, stakingContract, tierContract, yieldFarming, tokenA, tokenB) {
        console.log('  🔗 Configurando referencias cruzadas...');
        
        try {
            // Inicializar Yield Farming con otros contratos
            await yieldFarming.methods.initializeContracts(
                oxsToken.options.address,
                stakingContract.options.address,
                tierContract.options.address
            ).send({
                from: this.deployerAccount.address,
                gas: 500000,
                gasPrice: SEPOLIA_CONFIG.gasPrice
            });
            
            console.log('    ✅ Yield Farming inicializado');
            
            // Crear pool inicial
            await yieldFarming.methods.createPool(
                tokenA.options.address,  // tokenA
                tokenB.options.address,  // tokenB
                1200,                    // baseAPY (12%)
                2000,                    // maxMultiplier (2x)
                1000,                    // feeInitial (10%)
                100,                     // feeFinal (1%)
                12                       // vestingWeeks
            ).send({
                from: this.deployerAccount.address,
                gas: 800000,
                gasPrice: SEPOLIA_CONFIG.gasPrice
            });
            
            console.log('    ✅ Pool inicial creado');
            
            // Transferir tokens al deployer para testing
            const transferAmount = '10000000000000000000000'; // 10,000 tokens
            
            await tokenA.methods.transfer(this.deployerAccount.address, transferAmount).send({
                from: this.deployerAccount.address,
                gas: 100000,
                gasPrice: SEPOLIA_CONFIG.gasPrice
            });
            
            await tokenB.methods.transfer(this.deployerAccount.address, transferAmount).send({
                from: this.deployerAccount.address,
                gas: 100000,
                gasPrice: SEPOLIA_CONFIG.gasPrice
            });
            
            console.log('    ✅ Tokens distribuidos para testing');
            
        } catch (error) {
            console.log('    ⚠️ Error en configuración:', error.message);
        }
    }

    async generateReport() {
        console.log('\n📋 GENERANDO REPORTE DE DEPLOYMENT...');
        
        const report = {
            network: SEPOLIA_CONFIG.networkName,
            chainId: SEPOLIA_CONFIG.chainId,
            deployer: this.deployerAccount.address,
            timestamp: new Date().toISOString(),
            explorerUrl: SEPOLIA_CONFIG.explorerUrl,
            contracts: this.deployedContracts,
            summary: {
                totalContracts: Object.keys(this.deployedContracts).length,
                totalGasUsed: this.gasUsed,
                totalCostETH: this.totalCost
            }
        };
        
        // Guardar reporte
        const reportPath = `deployment-report-sepolia-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('📊 RESUMEN DEL DEPLOYMENT:');
        console.log('=====================================');
        console.log(`🌐 Network: ${report.network}`);
        console.log(`👤 Deployer: ${report.deployer}`);
        console.log(`📅 Timestamp: ${report.timestamp}`);
        console.log(`📄 Contratos deployados: ${report.summary.totalContracts}`);
        console.log(`⛽ Gas total usado: ${report.summary.totalGasUsed.toLocaleString()}`);
        console.log(`💰 Costo total: ${report.summary.totalCostETH.toFixed(6)} ETH`);
        console.log(`📁 Reporte guardado: ${reportPath}`);
        
        console.log('\n🔗 DIRECCIONES DE CONTRATOS:');
        console.log('=====================================');
        Object.entries(this.deployedContracts).forEach(([name, data]) => {
            console.log(`${name}: ${data.address}`);
            console.log(`  🔗 ${SEPOLIA_CONFIG.explorerUrl}/address/${data.address}`);
        });
        
        console.log('\n🎯 PRÓXIMOS PASOS:');
        console.log('=====================================');
        console.log('1. 🔍 Verificar contratos en Etherscan');
        console.log('2. 🧪 Ejecutar tests de integración');
        console.log('3. 📱 Configurar frontend/dApp');
        console.log('4. 👥 Invitar a beta testers');
        console.log('5. 📢 Publicar en comunidades DeFi');
    }
}

// Función principal
async function main() {
    try {
        const deployer = new SepoliaDeployer();
        await deployer.deployEcosystem();
    } catch (error) {
        console.error('💥 Deployment failed:', error);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { SepoliaDeployer }; 