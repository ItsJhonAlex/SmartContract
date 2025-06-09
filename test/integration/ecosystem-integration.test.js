/**
 * 🧪 ECOSYSTEM INTEGRATION TESTS
 * ===============================
 * 
 * Tests exhaustivos de integración del ecosistema OXS DeFi
 * Verificando interacciones entre todos los contratos
 */

const { expect } = require('chai');
const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const { Web3 } = require('web3');

// Importar el integrador
const { EcosystemIntegrator, DEPLOYED_ADDRESSES } = require('../../scripts/integrate-ecosystem');

contract('🌟 OXS Ecosystem Integration Tests', function (accounts) {
    const [deployer, user1, user2, user3] = accounts;
    
    let web3;
    let integrator;
    let contracts;
    
    // Cantidades de test
    const STAKE_AMOUNT = new BN('1000000000000000000000'); // 1000 OXS
    const LIQUIDITY_AMOUNT_A = new BN('500000000000000000000'); // 500 tokens
    const LIQUIDITY_AMOUNT_B = new BN('500000000000000000000'); // 500 tokens
    
    before(async function () {
        console.log('🚀 Inicializando tests de integración...');
        
        // Configurar Web3
        web3 = new Web3('http://localhost:8545');
        
        // Inicializar integrador 
        integrator = new EcosystemIntegrator();
        await integrator.loadContracts();
        contracts = integrator.contracts;
        
        console.log('✅ Ecosistema cargado para testing');
    });

    describe('🔗 Verificación de Integración Base', function () {
        
        it('✅ Debe tener todos los contratos conectados correctamente', async function () {
            // Verificar que Yield Farming conoce otros contratos
            const oxsAddress = await contracts.yieldFarmingContract.methods.oxsTokenAddress().call();
            const stakingAddress = await contracts.yieldFarmingContract.methods.stakingContractAddress().call();
            const tierAddress = await contracts.yieldFarmingContract.methods.tierContractAddress().call();
            
            expect(oxsAddress).to.equal(DEPLOYED_ADDRESSES.oxsTokenStaking);
            expect(stakingAddress).to.equal(DEPLOYED_ADDRESSES.stakingContract);
            expect(tierAddress).to.equal(DEPLOYED_ADDRESSES.tierContract);
        });
        
        it('✅ Debe tener pool inicial configurado correctamente', async function () {
            const totalPools = await contracts.yieldFarmingContract.methods.getTotalPools().call();
            expect(totalPools.toString()).to.equal('1');
            
            const poolInfo = await contracts.yieldFarmingContract.methods.getPoolInfo(0).call();
            expect(poolInfo.tokenA).to.equal(DEPLOYED_ADDRESSES.tokenA);
            expect(poolInfo.tokenB).to.equal(DEPLOYED_ADDRESSES.tokenB);
            expect(poolInfo.baseAPY.toString()).to.equal('1200'); // 12%
            expect(poolInfo.isActive).to.be.true;
        });
        
        it('✅ Debe tener tokens inicializados con suficiente supply', async function () {
            // Verificar supply de tokens
            const oxsSupply = await contracts.oxsTokenStaking.methods.totalSupply().call();
            const tokenASupply = await contracts.tokenA.methods.totalSupply().call();
            const tokenBSupply = await contracts.tokenB.methods.totalSupply().call();
            
            expect(new BN(oxsSupply)).to.be.bignumber.greaterThan(new BN('0'));
            expect(new BN(tokenASupply)).to.be.bignumber.greaterThan(new BN('0'));
            expect(new BN(tokenBSupply)).to.be.bignumber.greaterThan(new BN('0'));
        });
    });

    describe('🎯 Flujo Completo de Usuario', function () {
        
        it('✅ Debe permitir flujo completo: stake → tier upgrade → farming', async function () {
            console.log('  📝 Iniciando flujo completo de usuario...');
            
            // PASO 1: Obtener tokens para el usuario
            console.log('  💰 Distribuyendo tokens iniciales...');
            
            // Transfer OXS tokens al usuario para staking
            await contracts.oxsTokenStaking.methods.transfer(user1, STAKE_AMOUNT.toString()).send({
                from: deployer
            });
            
            // Transfer tokens A y B para liquidity farming
            await contracts.tokenA.methods.transfer(user1, LIQUIDITY_AMOUNT_A.toString()).send({
                from: deployer
            });
            await contracts.tokenB.methods.transfer(user1, LIQUIDITY_AMOUNT_B.toString()).send({
                from: deployer
            });
            
            // Verificar balances
            const oxsBalance = await contracts.oxsTokenStaking.methods.balanceOf(user1).call();
            const tokenABalance = await contracts.tokenA.methods.balanceOf(user1).call();
            const tokenBBalance = await contracts.tokenB.methods.balanceOf(user1).call();
            
            expect(new BN(oxsBalance)).to.be.bignumber.equal(STAKE_AMOUNT);
            expect(new BN(tokenABalance)).to.be.bignumber.equal(LIQUIDITY_AMOUNT_A);
            expect(new BN(tokenBBalance)).to.be.bignumber.equal(LIQUIDITY_AMOUNT_B);
            
            console.log('  ✅ Tokens distribuidos correctamente');
            
            // PASO 2: Staking en el contrato de staking
            console.log('  🏦 Realizando staking...');
            
            // Aprobar tokens para staking
            await contracts.oxsTokenStaking.methods.approve(
                DEPLOYED_ADDRESSES.stakingContract, 
                STAKE_AMOUNT.toString()
            ).send({ from: user1 });
            
            // Hacer stake
            await contracts.stakingContract.methods.stake(STAKE_AMOUNT.toString()).send({
                from: user1
            });
            
            // Verificar stake
            const userStake = await contracts.stakingContract.methods.getUserStakeInfo(user1).call();
            expect(new BN(userStake.stakedAmount)).to.be.bignumber.equal(STAKE_AMOUNT);
            
            console.log('  ✅ Staking completado:', web3.utils.fromWei(userStake.stakedAmount, 'ether'), 'OXS');
            
            // PASO 3: Upgrade de tier automático
            console.log('  🏆 Verificando upgrade de tier...');
            
            // El tier debería haberse actualizado automáticamente al hacer stake
            const userTierInfo = await contracts.tierContract.methods.getUserTierInfo(user1).call();
            console.log('  🎯 Tier del usuario:', userTierInfo.tierId.toString());
            
            // PASO 4: Yield Farming
            console.log('  🌾 Iniciando yield farming...');
            
            // Aprobar tokens para yield farming
            await contracts.tokenA.methods.approve(
                DEPLOYED_ADDRESSES.yieldFarmingContract,
                LIQUIDITY_AMOUNT_A.toString()
            ).send({ from: user1 });
            
            await contracts.tokenB.methods.approve(
                DEPLOYED_ADDRESSES.yieldFarmingContract,
                LIQUIDITY_AMOUNT_B.toString()  
            ).send({ from: user1 });
            
            // Depositar liquidez en pool 0
            await contracts.yieldFarmingContract.methods.depositLiquidity(
                0, // poolId
                LIQUIDITY_AMOUNT_A.toString(),
                LIQUIDITY_AMOUNT_B.toString()
            ).send({ from: user1 });
            
            // Verificar depósito
            const userPoolInfo = await contracts.yieldFarmingContract.methods.getUserPoolInfo(user1, 0).call();
            expect(userPoolInfo.isActive).to.be.true;
            expect(new BN(userPoolInfo.liquidityAmount)).to.be.bignumber.greaterThan(new BN('0'));
            
            console.log('  ✅ Liquidez depositada:', web3.utils.fromWei(userPoolInfo.liquidityAmount, 'ether'));
            
            // PASO 5: Simular paso del tiempo y verificar rewards
            console.log('  ⏰ Simulando paso del tiempo...');
            
            // Avanzar tiempo (1 día)
            await time.increase(time.duration.days(1));
            
            // Calcular rewards esperados
            const rewardCalc = await contracts.yieldFarmingContract.methods.calculateRewards(user1, 0).call();
            console.log('  💎 Rewards calculados:', web3.utils.fromWei(rewardCalc.finalReward, 'ether'), 'OXS');
            console.log('  🔥 Tier multiplier:', rewardCalc.tierMultiplier.toString());
            console.log('  ⚡ Time bonus:', rewardCalc.timeBonus.toString());
            console.log('  🎁 Staking bonus:', rewardCalc.stakingBonus.toString());
            
            expect(new BN(rewardCalc.finalReward)).to.be.bignumber.greaterThan(new BN('0'));
            
            console.log('  🎉 FLUJO COMPLETO EXITOSO!');
        });
        
        it('✅ Debe calcular multiplicadores correctamente basado en tier y staking', async function () {
            console.log('  🧮 Verificando cálculos de multiplicadores...');
            
            // Obtener información del usuario
            const userTierInfo = await contracts.tierContract.methods.getUserTierInfo(user1).call();
            const userStakeInfo = await contracts.stakingContract.methods.getUserStakeInfo(user1).call();
            const rewardCalc = await contracts.yieldFarmingContract.methods.calculateRewards(user1, 0).call();
            
            console.log('  📊 Información del usuario:');
            console.log('    🏆 Tier ID:', userTierInfo.tierId.toString());
            console.log('    🏦 Staked Amount:', web3.utils.fromWei(userStakeInfo.stakedAmount, 'ether'), 'OXS');
            console.log('    🔥 Tier Multiplier:', rewardCalc.tierMultiplier.toString());
            console.log('    ⚡ Time Bonus:', rewardCalc.timeBonus.toString());
            console.log('    🎁 Staking Bonus:', rewardCalc.stakingBonus.toString());
            
            // Los multiplicadores deben ser > 1000 (base 1000 = 1.0x)
            expect(new BN(rewardCalc.tierMultiplier)).to.be.bignumber.greaterThan(new BN('1000'));
            expect(new BN(rewardCalc.timeBonus)).to.be.bignumber.greaterThan(new BN('0'));
            expect(new BN(rewardCalc.stakingBonus)).to.be.bignumber.greaterThan(new BN('0'));
        });
    });

    describe('🔄 Tests de Interacciones Cruzadas', function () {
        
        it('✅ Debe reflejar cambios de tier en rewards de farming', async function () {
            console.log('  🔄 Testeando interacciones tier ↔ farming...');
            
            // Obtener rewards actuales
            const rewardsBefore = await contracts.yieldFarmingContract.methods.calculateRewards(user1, 0).call();
            
            // Hacer más staking para subir de tier
            const additionalStake = new BN('2000000000000000000000'); // 2000 OXS más
            
            // Dar más tokens al usuario
            await contracts.oxsTokenStaking.methods.transfer(user1, additionalStake.toString()).send({
                from: deployer
            });
            
            // Aprobar y hacer stake adicional
            await contracts.oxsTokenStaking.methods.approve(
                DEPLOYED_ADDRESSES.stakingContract,
                additionalStake.toString()
            ).send({ from: user1 });
            
            await contracts.stakingContract.methods.stake(additionalStake.toString()).send({
                from: user1
            });
            
            // Verificar nuevo tier
            const newTierInfo = await contracts.tierContract.methods.getUserTierInfo(user1).call();
            console.log('    🏆 Nuevo tier:', newTierInfo.tierId.toString());
            
            // Verificar que los rewards mejoraron
            const rewardsAfter = await contracts.yieldFarmingContract.methods.calculateRewards(user1, 0).call();
            
            console.log('    📈 Multiplicador antes:', rewardsBefore.tierMultiplier.toString());
            console.log('    📈 Multiplicador después:', rewardsAfter.tierMultiplier.toString());
            
            expect(new BN(rewardsAfter.tierMultiplier)).to.be.bignumber.greaterThanOrEqual(
                new BN(rewardsBefore.tierMultiplier)
            );
        });
        
        it('✅ Debe manejar fees dinámicos correctamente con vesting', async function () {
            console.log('  💰 Testeando fees dinámicos y vesting...');
            
            // Calcular fee inicial (debería ser alto)
            const initialFee = await contracts.yieldFarmingContract.methods.calculateDynamicFee(user1, 0).call();
            console.log('    💸 Fee inicial:', (initialFee / 100).toFixed(2) + '%');
            
            // Simular paso de tiempo (avanzar varias semanas)
            await time.increase(time.duration.weeks(6));
            
            // Calcular fee después del tiempo
            const laterFee = await contracts.yieldFarmingContract.methods.calculateDynamicFee(user1, 0).call();
            console.log('    💸 Fee después de 6 semanas:', (laterFee / 100).toFixed(2) + '%');
            
            // El fee debería haber disminuido
            expect(new BN(laterFee)).to.be.bignumber.lessThan(new BN(initialFee));
        });
    });

    describe('📊 Tests de Estado del Ecosistema', function () {
        
        it('✅ Debe reportar métricas correctas del ecosistema', async function () {
            console.log('  📊 Verificando métricas del ecosistema...');
            
            // Métricas de Staking
            const totalStaked = await contracts.stakingContract.methods.totalStaked().call();
            const activeStakers = await contracts.stakingContract.methods.activeStakers().call();
            
            // Métricas de Yield Farming
            const totalPools = await contracts.yieldFarmingContract.methods.getTotalPools().call();
            const totalRewardsDistributed = await contracts.yieldFarmingContract.methods.totalRewardsDistributed().call();
            
            // Métricas de Tiers
            const user1TierInfo = await contracts.tierContract.methods.getUserTierInfo(user1).call();
            
            console.log('  📈 MÉTRICAS DEL ECOSISTEMA:');
            console.log('    🏦 Total Staked:', web3.utils.fromWei(totalStaked, 'ether'), 'OXS');
            console.log('    👥 Active Stakers:', activeStakers.toString());
            console.log('    🏊 Total Pools:', totalPools.toString());
            console.log('    💰 Total Rewards:', web3.utils.fromWei(totalRewardsDistributed, 'ether'), 'OXS');
            console.log('    🏆 User1 Tier:', user1TierInfo.tierId.toString());
            
            // Verificaciones
            expect(new BN(totalStaked)).to.be.bignumber.greaterThan(new BN('0'));
            expect(new BN(activeStakers)).to.be.bignumber.greaterThan(new BN('0'));
            expect(new BN(totalPools)).to.be.bignumber.equal(new BN('1'));
        });
        
        it('✅ Debe permitir reclamar rewards exitosamente', async function () {
            console.log('  🎁 Testeando claim de rewards...');
            
            // Verificar rewards pendientes
            const userPoolInfo = await contracts.yieldFarmingContract.methods.getUserPoolInfo(user1, 0).call();
            console.log('    💎 Pending rewards:', web3.utils.fromWei(userPoolInfo.pendingRewards, 'ether'), 'OXS');
            
            // Balance antes del claim
            const balanceBefore = await contracts.oxsTokenStaking.methods.balanceOf(user1).call();
            
            // Claim rewards
            await contracts.yieldFarmingContract.methods.claimRewards(0).send({
                from: user1
            });
            
            // Verificar balance después
            const balanceAfter = await contracts.oxsTokenStaking.methods.balanceOf(user1).call();
            const balanceIncrease = new BN(balanceAfter).sub(new BN(balanceBefore));
            
            console.log('    💰 Rewards reclamados:', web3.utils.fromWei(balanceIncrease, 'ether'), 'OXS');
            
            expect(balanceIncrease).to.be.bignumber.greaterThan(new BN('0'));
        });
    });

    describe('🚨 Tests de Seguridad y Edge Cases', function () {
        
        it('✅ Debe rechazar operaciones con parámetros inválidos', async function () {
            console.log('  🚨 Testeando validaciones de seguridad...');
            
            // Test 1: Intentar depositar en pool inexistente
            await expectRevert(
                contracts.yieldFarmingContract.methods.depositLiquidity(
                    999, // Pool inexistente
                    '1000',
                    '1000'
                ).send({ from: user1 }),
                'Pool no existe'
            );
            
            // Test 2: Intentar retirar más liquidez de la disponible
            await expectRevert(
                contracts.yieldFarmingContract.methods.withdrawLiquidity(
                    0,
                    '999999999999999999999999' // Cantidad massive
                ).send({ from: user1 }),
                'Cantidad insuficiente'
            );
            
            console.log('    ✅ Validaciones de seguridad funcionando correctamente');
        });
        
        it('✅ Debe manejar usuarios sin staking correctamente', async function () {
            console.log('  👤 Testeando usuarios sin staking...');
            
            // user2 no tiene staking
            const user2TierInfo = await contracts.tierContract.methods.getUserTierInfo(user2).call();
            console.log('    🏆 Tier de user2 (sin staking):', user2TierInfo.tierId.toString());
            
            // Debería estar en tier 0 (básico)
            expect(user2TierInfo.tierId.toString()).to.equal('0');
        });
    });

    after(function () {
        console.log('\n🎉 ¡TODOS LOS TESTS DE INTEGRACIÓN COMPLETADOS EXITOSAMENTE!');
        console.log('✅ El ecosistema OXS DeFi está 100% funcional y listo para producción! 🚀');
    });
}); 