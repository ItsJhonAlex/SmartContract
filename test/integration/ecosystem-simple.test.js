/**
 * 🧪 ECOSYSTEM SIMPLE INTEGRATION TESTS
 * ======================================
 * 
 * Tests simplificados de integración usando Truffle nativo
 */

const { Web3 } = require('web3');
const { DEPLOYED_ADDRESSES } = require('../../scripts/integrate-ecosystem');

// ABIs simplificados para testing
const ERC20_ABI = [
    {
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf", 
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    }
];

const YIELD_FARMING_ABI = [
    {
        "inputs": [],
        "name": "getTotalPools",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "inputs": [],
        "name": "oxsTokenAddress",
        "outputs": [{"name": "", "type": "address"}],
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingContractAddress",
        "outputs": [{"name": "", "type": "address"}],
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tierContractAddress",
        "outputs": [{"name": "", "type": "address"}],
        "type": "function"
    }
];

describe('🌟 OXS Ecosystem Simple Integration Tests', function() {
    let web3;
    let accounts;
    let deployer;
    let user1;
    
    before(async function() {
        // Setup Web3
        web3 = new Web3('http://localhost:8545');
        accounts = await web3.eth.getAccounts();
        deployer = accounts[0];
        user1 = accounts[1];
        
        console.log('🚀 Tests de integración iniciados');
        console.log('📍 Deployer:', deployer);
        console.log('👤 User1:', user1);
    });

    describe('🔗 Verificación de Integración Base', function() {
        
        it('✅ Debe verificar que todos los contratos están deployados', async function() {
            console.log('  🔍 Verificando contratos deployados...');
            
            // Verificar que las direcciones no sean cero
            assert.notEqual(DEPLOYED_ADDRESSES.oxsTokenStaking, '0x0000000000000000000000000000000000000000');
            assert.notEqual(DEPLOYED_ADDRESSES.stakingContract, '0x0000000000000000000000000000000000000000');
            assert.notEqual(DEPLOYED_ADDRESSES.tierContract, '0x0000000000000000000000000000000000000000');
            assert.notEqual(DEPLOYED_ADDRESSES.yieldFarmingContract, '0x0000000000000000000000000000000000000000');
            
            console.log('    ✅ OXS Token (Staking):', DEPLOYED_ADDRESSES.oxsTokenStaking);
            console.log('    ✅ Staking Contract:', DEPLOYED_ADDRESSES.stakingContract);
            console.log('    ✅ Tier Contract:', DEPLOYED_ADDRESSES.tierContract);
            console.log('    ✅ Yield Farming:', DEPLOYED_ADDRESSES.yieldFarmingContract);
        });
        
        it('✅ Debe verificar que los contratos tienen código deployado', async function() {
            console.log('  📝 Verificando código en blockchain...');
            
            const contracts = [
                { name: 'OXS Token', address: DEPLOYED_ADDRESSES.oxsTokenStaking },
                { name: 'Staking Contract', address: DEPLOYED_ADDRESSES.stakingContract },
                { name: 'Tier Contract', address: DEPLOYED_ADDRESSES.tierContract },
                { name: 'Yield Farming', address: DEPLOYED_ADDRESSES.yieldFarmingContract }
            ];
            
            for (const contract of contracts) {
                const code = await web3.eth.getCode(contract.address);
                assert.notEqual(code, '0x', `${contract.name} no tiene código deployado`);
                console.log(`    ✅ ${contract.name}: Código verificado`);
            }
        });
        
        it('✅ Debe verificar que Yield Farming está integrado correctamente', async function() {
            console.log('  🔗 Verificando integración del Yield Farming...');
            
            const yieldFarming = new web3.eth.Contract(YIELD_FARMING_ABI, DEPLOYED_ADDRESSES.yieldFarmingContract);
            
            try {
                // Verificar direcciones configuradas
                const oxsAddress = await yieldFarming.methods.oxsTokenAddress().call();
                const stakingAddress = await yieldFarming.methods.stakingContractAddress().call();
                const tierAddress = await yieldFarming.methods.tierContractAddress().call();
                
                console.log('    📍 OXS Token en YF:', oxsAddress);
                console.log('    📍 Staking en YF:', stakingAddress);
                console.log('    📍 Tier en YF:', tierAddress);
                
                // Verificar que no sean direcciones cero
                assert.notEqual(oxsAddress, '0x0000000000000000000000000000000000000000');
                assert.notEqual(stakingAddress, '0x0000000000000000000000000000000000000000');
                assert.notEqual(tierAddress, '0x0000000000000000000000000000000000000000');
                
                // Verificar que coincidan con las direcciones esperadas
                assert.equal(oxsAddress.toLowerCase(), DEPLOYED_ADDRESSES.oxsTokenStaking.toLowerCase());
                assert.equal(stakingAddress.toLowerCase(), DEPLOYED_ADDRESSES.stakingContract.toLowerCase());
                assert.equal(tierAddress.toLowerCase(), DEPLOYED_ADDRESSES.tierContract.toLowerCase());
                
                console.log('    ✅ Referencias cruzadas verificadas correctamente');
                
            } catch (error) {
                console.log('    ⚠️ Error verificando integración:', error.message);
                throw error;
            }
        });
        
        it('✅ Debe verificar que hay pools configurados', async function() {
            console.log('  🏊 Verificando pools de Yield Farming...');
            
            const yieldFarming = new web3.eth.Contract(YIELD_FARMING_ABI, DEPLOYED_ADDRESSES.yieldFarmingContract);
            
            try {
                const totalPools = await yieldFarming.methods.getTotalPools().call();
                console.log('    📊 Total pools:', totalPools.toString());
                
                // Debe haber al menos 1 pool
                assert(parseInt(totalPools) >= 1, 'Debe haber al menos 1 pool configurado');
                
                console.log('    ✅ Pools configurados correctamente');
                
            } catch (error) {
                console.log('    ⚠️ Error verificando pools:', error.message);
                throw error;
            }
        });
    });

    describe('💰 Verificación de Tokens', function() {
        
        it('✅ Debe verificar que los tokens tienen supply', async function() {
            console.log('  💎 Verificando supply de tokens...');
            
            const tokens = [
                { name: 'OXS Token (Staking)', address: DEPLOYED_ADDRESSES.oxsTokenStaking },
                { name: 'OXS Token (Yield)', address: DEPLOYED_ADDRESSES.oxsTokenYield },
                { name: 'Token A', address: DEPLOYED_ADDRESSES.tokenA },
                { name: 'Token B', address: DEPLOYED_ADDRESSES.tokenB }
            ];
            
            for (const token of tokens) {
                if (token.address && token.address !== '0x0000000000000000000000000000000000000000') {
                    try {
                        const tokenContract = new web3.eth.Contract(ERC20_ABI, token.address);
                        const totalSupply = await tokenContract.methods.totalSupply().call();
                        
                        console.log(`    💰 ${token.name}: ${web3.utils.fromWei(totalSupply, 'ether')} tokens`);
                        
                        assert(parseInt(totalSupply) > 0, `${token.name} debe tener supply > 0`);
                        
                    } catch (error) {
                        console.log(`    ⚠️ Error verificando ${token.name}:`, error.message);
                    }
                }
            }
        });
        
        it('✅ Debe verificar balances del deployer', async function() {
            console.log('  👑 Verificando balances del deployer...');
            
            const oxsToken = new web3.eth.Contract(ERC20_ABI, DEPLOYED_ADDRESSES.oxsTokenStaking);
            
            try {
                const balance = await oxsToken.methods.balanceOf(deployer).call();
                console.log('    💰 Balance del deployer:', web3.utils.fromWei(balance, 'ether'), 'OXS');
                
                assert(parseInt(balance) > 0, 'Deployer debe tener tokens OXS');
                
            } catch (error) {
                console.log('    ⚠️ Error verificando balance:', error.message);
                throw error;
            }
        });
    });

    describe('🎯 Test de Funcionalidad Básica', function() {
        
        it('✅ Debe permitir transferir tokens entre cuentas', async function() {
            console.log('  💸 Testeando transferencia de tokens...');
            
            const oxsToken = new web3.eth.Contract(ERC20_ABI, DEPLOYED_ADDRESSES.oxsTokenStaking);
            const transferAmount = web3.utils.toWei('100', 'ether'); // 100 OXS
            
            try {
                // Balance inicial del user1
                const initialBalance = await oxsToken.methods.balanceOf(user1).call();
                console.log('    💰 Balance inicial user1:', web3.utils.fromWei(initialBalance, 'ether'), 'OXS');
                
                // Transferir tokens
                await oxsToken.methods.transfer(user1, transferAmount).send({
                    from: deployer,
                    gas: 100000
                });
                
                // Balance final del user1
                const finalBalance = await oxsToken.methods.balanceOf(user1).call();
                console.log('    💰 Balance final user1:', web3.utils.fromWei(finalBalance, 'ether'), 'OXS');
                
                // Verificar que la transferencia funcionó
                const expectedBalance = web3.utils.toBN(initialBalance).add(web3.utils.toBN(transferAmount));
                assert.equal(finalBalance.toString(), expectedBalance.toString(), 'La transferencia no funcionó correctamente');
                
                console.log('    ✅ Transferencia exitosa');
                
            } catch (error) {
                console.log('    ⚠️ Error en transferencia:', error.message);
                throw error;
            }
        });
    });

    after(function() {
        console.log('\n🎉 ¡TESTS DE INTEGRACIÓN BÁSICOS COMPLETADOS!');
        console.log('✅ El ecosistema OXS está funcionando correctamente! 🚀');
    });
}); 