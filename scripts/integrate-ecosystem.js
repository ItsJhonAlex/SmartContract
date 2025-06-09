/**
 * 🔗 OXS ECOSYSTEM INTEGRATION SCRIPT
 * =====================================
 * 
 * Script para integrar todos los contratos desplegados
 * configurando referencias cruzadas y parámetros iniciales
 */

const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Direcciones de contratos desplegados (LOCAL DEPLOYMENT)
const DEPLOYED_ADDRESSES = {
    // Contratos principales
    oxsTokenStaking: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    stakingContract: '0xC89Ce4735882C9F0f0FE26686c53074E09B0D550',
    tierContract: '0x9b1f7F645351AF3631a656421eD2e40f2802E6c0',
    yieldFarmingContract: '0x630589690929E9cdEFDeF0734717a9eF3Ec7Fcfe',
    
    // Tokens mock para yield farming
    oxsTokenYield: '0x0E696947A06550DEf604e82C26fd9E493e576337',
    tokenA: '0xDb56f2e9369E0D7bD191099125a3f6C370F8ed15',
    tokenB: '0xA94B7f0465E98609391C623d0560C5720a3f2D33'
};

class EcosystemIntegrator {
    constructor() {
        this.web3 = new Web3('http://localhost:8545');
        this.deployer = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
        this.deployerPrivateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
        this.contracts = {};
        
        // Agregar cuenta
        this.web3.eth.accounts.wallet.add(this.deployerPrivateKey);
    }

    /**
     * 🚀 Función principal de integración
     */
    async integrateEcosystem() {
        console.log('🔗 ¡Iniciando integración del ecosistema OXS DeFi!');
        console.log('====================================================');
        
        try {
            // 1. Cargar contratos
            await this.loadContracts();
            
            // 2. Verificar estados iniciales
            await this.verifyInitialStates();
            
            // 3. Configurar referencias cruzadas
            await this.setupCrossReferences();
            
            // 4. Configurar parámetros iniciales
            await this.setupInitialParameters();
            
            // 5. Verificar integración
            await this.verifyIntegration();
            
            console.log('🎉 ¡Integración completada exitosamente!');
            
        } catch (error) {
            console.error('❌ Error durante integración:', error);
            throw error;
        }
    }

    /**
     * 📋 Cargar todos los contratos
     */
    async loadContracts() {
        console.log('\n📋 Cargando contratos...');
        
        // Cargar ABIs
        const stakingData = await this.loadContractData('OXO_StakingContract', 'OXSStaking');
        const tierData = await this.loadContractData('OXO_TierContract', 'OXSTier');
        const yieldData = await this.loadContractData('OXO_YildFarmingContract', 'OXSYieldFarming');
        const tokenData = await this.loadContractData('OXO_YildFarmingContract', 'MockERC20');
        
        // Crear instancias de contratos
        this.contracts = {
            stakingContract: new this.web3.eth.Contract(stakingData.abi, DEPLOYED_ADDRESSES.stakingContract),
            tierContract: new this.web3.eth.Contract(tierData.abi, DEPLOYED_ADDRESSES.tierContract),
            yieldFarmingContract: new this.web3.eth.Contract(yieldData.abi, DEPLOYED_ADDRESSES.yieldFarmingContract),
            oxsTokenStaking: new this.web3.eth.Contract(tokenData.abi, DEPLOYED_ADDRESSES.oxsTokenStaking),
            oxsTokenYield: new this.web3.eth.Contract(tokenData.abi, DEPLOYED_ADDRESSES.oxsTokenYield),
            tokenA: new this.web3.eth.Contract(tokenData.abi, DEPLOYED_ADDRESSES.tokenA),
            tokenB: new this.web3.eth.Contract(tokenData.abi, DEPLOYED_ADDRESSES.tokenB)
        };
        
        console.log('✅ Contratos cargados exitosamente');
    }

    /**
     * 🔍 Verificar estados iniciales
     */
    async verifyInitialStates() {
        console.log('\n🔍 Verificando estados iniciales...');
        
        try {
            // Verificar Staking Contract
            const stakingToken = await this.contracts.stakingContract.methods.oxsToken().call();
            console.log('  🏦 Staking - Token OXS:', stakingToken);
            
            // Verificar Tier Contract  
            const tierToken = await this.contracts.tierContract.methods.oxsToken().call();
            console.log('  🏆 Tier - Token OXS:', tierToken);
            
            // Verificar Yield Farming
            const yieldOwner = await this.contracts.yieldFarmingContract.methods.owner().call();
            console.log('  🌾 Yield Farming - Owner:', yieldOwner);
            
            // Verificar balances de tokens
            const stakingBalance = await this.contracts.oxsTokenStaking.methods.balanceOf(DEPLOYED_ADDRESSES.stakingContract).call();
            console.log('  💰 Staking Contract Balance:', this.web3.utils.fromWei(stakingBalance, 'ether'), 'OXS');
            
            console.log('✅ Estados iniciales verificados');
            
        } catch (error) {
            console.log('⚠️ Error verificando estados iniciales:', error.message);
        }
    }

    /**
     * 🔗 Configurar referencias cruzadas
     */
    async setupCrossReferences() {
        console.log('\n🔗 Configurando referencias cruzadas...');
        
        try {
            // 1. Inicializar Yield Farming con direcciones de otros contratos
            console.log('  🌾 Configurando Yield Farming...');
            
            const initTx = await this.contracts.yieldFarmingContract.methods.initializeContracts(
                DEPLOYED_ADDRESSES.oxsTokenStaking, // Usar el token del staking como principal
                DEPLOYED_ADDRESSES.stakingContract,
                DEPLOYED_ADDRESSES.tierContract
            ).send({
                from: this.deployer,
                gas: 500000
            });
            
            console.log('    ✅ Yield Farming inicializado - TX:', initTx.transactionHash);
            
            // 2. Verificar que las direcciones se configuraron correctamente
            const oxsAddress = await this.contracts.yieldFarmingContract.methods.oxsTokenAddress().call();
            const stakingAddress = await this.contracts.yieldFarmingContract.methods.stakingContractAddress().call();
            const tierAddress = await this.contracts.yieldFarmingContract.methods.tierContractAddress().call();
            
            console.log('    📍 OXS Token:', oxsAddress);
            console.log('    📍 Staking Contract:', stakingAddress);
            console.log('    📍 Tier Contract:', tierAddress);
            
            console.log('✅ Referencias cruzadas configuradas');
            
        } catch (error) {
            console.log('⚠️ Error configurando referencias:', error.message);
        }
    }

    /**
     * ⚙️ Configurar parámetros iniciales
     */
    async setupInitialParameters() {
        console.log('\n⚙️ Configurando parámetros iniciales...');
        
        try {
            // 1. Crear pool inicial en Yield Farming
            console.log('  🏊 Creando pool inicial...');
            
            const createPoolTx = await this.contracts.yieldFarmingContract.methods.createPool(
                DEPLOYED_ADDRESSES.tokenA,      // tokenA
                DEPLOYED_ADDRESSES.tokenB,      // tokenB  
                1200,                           // baseAPY (12%)
                2000,                           // maxMultiplier (2x)
                1000,                           // feeInitial (10%)
                100,                            // feeFinal (1%)
                12                              // vestingWeeks (12 semanas)
            ).send({
                from: this.deployer,
                gas: 500000
            });
            
            console.log('    ✅ Pool creado - TX:', createPoolTx.transactionHash);
            
            // 2. Configurar algunos parámetros de protocolo
            const totalPools = await this.contracts.yieldFarmingContract.methods.getTotalPools().call();
            console.log('    📊 Total pools:', totalPools);
            
            console.log('✅ Parámetros iniciales configurados');
            
        } catch (error) {
            console.log('⚠️ Error configurando parámetros:', error.message);
        }
    }

    /**
     * ✅ Verificar integración completa
     */
    async verifyIntegration() {
        console.log('\n✅ Verificando integración completa...');
        
        try {
            // 1. Verificar conexiones
            const oxsAddress = await this.contracts.yieldFarmingContract.methods.oxsTokenAddress().call();
            const stakingAddress = await this.contracts.yieldFarmingContract.methods.stakingContractAddress().call();
            const tierAddress = await this.contracts.yieldFarmingContract.methods.tierContractAddress().call();
            
            const allConnected = oxsAddress !== '0x0000000000000000000000000000000000000000' &&
                               stakingAddress !== '0x0000000000000000000000000000000000000000' &&
                               tierAddress !== '0x0000000000000000000000000000000000000000';
            
            // 2. Verificar pools
            const totalPools = await this.contracts.yieldFarmingContract.methods.getTotalPools().call();
            
            // 3. Verificar funcionalidades básicas  
            const totalRewardsDistributed = await this.contracts.yieldFarmingContract.methods.totalRewardsDistributed().call();
            
            console.log('📊 RESUMEN DE INTEGRACIÓN:');
            console.log(`   🔗 Contratos conectados: ${allConnected ? '✅' : '❌'}`);
            console.log(`   🏊 Total pools: ${totalPools}`);
            console.log(`   💰 Total rewards distribuidos: ${this.web3.utils.fromWei(totalRewardsDistributed.toString(), 'ether')} OXS`);
            console.log(`   🌾 Yield Farming operativo: ${allConnected && totalPools > 0 ? '✅' : '❌'}`);
            
            if (allConnected && totalPools > 0) {
                console.log('🎉 ¡INTEGRACIÓN COMPLETAMENTE EXITOSA!');
            } else {
                console.log('⚠️ Integración parcial - revisar configuración');
            }
            
        } catch (error) {
            console.log('❌ Error verificando integración:', error.message);
        }
    }

    /**
     * 📁 Cargar datos de contrato
     */
    async loadContractData(projectPath, contractName) {
        const buildPath = path.join(__dirname, '..', projectPath, 'build', 'contracts', `${contractName}.json`);
        
        if (!fs.existsSync(buildPath)) {
            throw new Error(`❌ Archivo de contrato no encontrado: ${buildPath}`);
        }
        
        const contractJson = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
        
        return {
            abi: contractJson.abi,
            bytecode: contractJson.bytecode
        };
    }
}

// Función principal
async function main() {
    const integrator = new EcosystemIntegrator();
    await integrator.integrateEcosystem();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { EcosystemIntegrator, DEPLOYED_ADDRESSES }; 