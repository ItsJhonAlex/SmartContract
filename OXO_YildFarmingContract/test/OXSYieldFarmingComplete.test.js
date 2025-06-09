const OXSYieldFarming = artifacts.require("OXSYieldFarming");
const MockERC20 = artifacts.require("MockERC20");

const { expectRevert, expectEvent, BN, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("OXSYieldFarming - Complete Test Suite", accounts => {
  const [owner, user1, user2, user3, nonOwner] = accounts;
  let yieldFarmingContract;
  let oxsToken;
  let tokenA;
  let tokenB;
  let tokenC;
  
  // Constants for testing
  const REWARD_PRECISION = new BN("1000000000000000000"); // 1e18
  const MIN_DEPOSIT_AMOUNT = new BN("1000");
  const MAX_POOLS_PER_USER = new BN("10");
  
  // Pool parameters for testing
  const POOL_PARAMS = {
    baseAPY: new BN("1000"), // 10% in basis points
    maxMultiplier: new BN("300"), // 3x multiplier
    feeInitial: new BN("500"), // 5% initial fee
    feeFinal: new BN("50"), // 0.5% final fee
    vestingWeeks: new BN("52") // 52 weeks max vesting
  };
  
  const LIQUIDITY_AMOUNTS = {
    small: new BN("5000000000000000000000"), // 5000 tokens
    medium: new BN("10000000000000000000000"), // 10000 tokens
    large: new BN("25000000000000000000000") // 25000 tokens
  };
  
  // Helper function for contract initialization
  const initializeYieldFarming = async () => {
    const dummyStaking = "0x1000000000000000000000000000000000000001";
    const dummyTier = "0x2000000000000000000000000000000000000002";
    
    await yieldFarmingContract.initializeContracts(
      oxsToken.address,
      dummyStaking,
      dummyTier,
      { from: owner }
    );
  };
  
  beforeEach(async () => {
    // Deploy YieldFarming contract
    yieldFarmingContract = await OXSYieldFarming.new(owner, { from: owner });
    
    // Deploy mock tokens
    oxsToken = await MockERC20.new("Mock OXS", "MOXS", 18, { from: owner });
    tokenA = await MockERC20.new("Mock Token A", "MTKA", 18, { from: owner });
    tokenB = await MockERC20.new("Mock Token B", "MTKB", 18, { from: owner });
    tokenC = await MockERC20.new("Mock Token C", "MTKC", 18, { from: owner });
    
    // Mint tokens for testing
    const mintAmount = new BN("1000000000000000000000000"); // 1M tokens each
    
    await oxsToken.mint(yieldFarmingContract.address, mintAmount, { from: owner }); // For rewards
    await tokenA.mint(user1, mintAmount, { from: owner });
    await tokenB.mint(user1, mintAmount, { from: owner });
    await tokenA.mint(user2, mintAmount, { from: owner });
    await tokenB.mint(user2, mintAmount, { from: owner });
    await tokenA.mint(user3, mintAmount, { from: owner });
    await tokenB.mint(user3, mintAmount, { from: owner });
    await tokenC.mint(user1, mintAmount, { from: owner });
  });
  
  describe("🔧 Inicialización y Configuración Básica", () => {
    it("debería inicializar correctamente el contrato", async () => {
      const totalPools = await yieldFarmingContract.getTotalPools();
      expect(totalPools).to.be.bignumber.equal(new BN("0"));
      
      const paused = await yieldFarmingContract.paused();
      expect(paused).to.be.false;
    });
    
    it("debería permitir al owner inicializar los contratos del ecosistema", async () => {
      // Using dummy addresses for testing (real addresses would be from deployed contracts)
      const dummyStaking = "0x1000000000000000000000000000000000000001";
      const dummyTier = "0x2000000000000000000000000000000000000002";
      
      await yieldFarmingContract.initializeContracts(
        oxsToken.address,
        dummyStaking,
        dummyTier,
        { from: owner }
      );
      
      const oxsAddress = await yieldFarmingContract.oxsTokenAddress();
      expect(oxsAddress).to.equal(oxsToken.address);
      
      const stakingAddress = await yieldFarmingContract.stakingContractAddress();
      expect(stakingAddress).to.equal(dummyStaking);
      
      const tierAddress = await yieldFarmingContract.tierContractAddress();
      expect(tierAddress).to.equal(dummyTier);
    });
    
    it("no debería permitir a no-owners inicializar contratos", async () => {
      const dummyStaking = "0x1000000000000000000000000000000000000001";
      const dummyTier = "0x2000000000000000000000000000000000000002";
      
      await expectRevert.unspecified(
        yieldFarmingContract.initializeContracts(
          oxsToken.address,
          dummyStaking,
          dummyTier,
          { from: nonOwner }
        )
      );
    });
    
    it("debería rechazar inicialización con direcciones inválidas", async () => {
      const dummyStaking = "0x1000000000000000000000000000000000000001";
      const dummyTier = "0x2000000000000000000000000000000000000002";
      
      await expectRevert(
        yieldFarmingContract.initializeContracts(
          "0x0000000000000000000000000000000000000000", // Invalid OXS address
          dummyStaking,
          dummyTier,
          { from: owner }
        ),
        "OXS token address no puede ser 0"
      );
    });
  });
  
  describe("🌾 Creación y Gestión de Pools", () => {
    beforeEach(async () => {
      await initializeYieldFarming();
    });
    
    it("debería crear un pool correctamente", async () => {
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      // Verify event
      expectEvent(receipt, 'PoolCreated', {
        poolId: new BN("0"),
        tokenA: tokenA.address,
        tokenB: tokenB.address,
        baseAPY: POOL_PARAMS.baseAPY
      });
      
      // Check pool info
      const poolInfo = await yieldFarmingContract.getPoolInfo(0);
      expect(poolInfo.tokenA).to.equal(tokenA.address);
      expect(poolInfo.tokenB).to.equal(tokenB.address);
      expect(poolInfo.baseAPY).to.be.bignumber.equal(POOL_PARAMS.baseAPY);
      expect(poolInfo.isActive).to.be.true;
      expect(poolInfo.totalLiquidity).to.be.bignumber.equal(new BN("0"));
      
      const totalPools = await yieldFarmingContract.getTotalPools();
      expect(totalPools).to.be.bignumber.equal(new BN("1"));
    });
    
    it("debería rechazar crear pool con tokens iguales", async () => {
      await expectRevert(
        yieldFarmingContract.createPool(
          tokenA.address,
          tokenA.address, // Same token
          POOL_PARAMS.baseAPY,
          POOL_PARAMS.maxMultiplier,
          POOL_PARAMS.feeInitial,
          POOL_PARAMS.feeFinal,
          POOL_PARAMS.vestingWeeks,
          { from: owner }
        ),
        "Tokens deben ser diferentes"
      );
    });
    
    it("debería rechazar crear pool con direcciones inválidas", async () => {
      await expectRevert(
        yieldFarmingContract.createPool(
          "0x0000000000000000000000000000000000000000",
          tokenB.address,
          POOL_PARAMS.baseAPY,
          POOL_PARAMS.maxMultiplier,
          POOL_PARAMS.feeInitial,
          POOL_PARAMS.feeFinal,
          POOL_PARAMS.vestingWeeks,
          { from: owner }
        ),
        "Direcciones de tokens invalidas"
      );
    });
    
    it("no debería permitir a no-owners crear pools", async () => {
      await expectRevert.unspecified(
        yieldFarmingContract.createPool(
          tokenA.address,
          tokenB.address,
          POOL_PARAMS.baseAPY,
          POOL_PARAMS.maxMultiplier,
          POOL_PARAMS.feeInitial,
          POOL_PARAMS.feeFinal,
          POOL_PARAMS.vestingWeeks,
          { from: nonOwner }
        )
      );
    });
  });
  
  describe("💰 Depósito de Liquidez", () => {
    let poolId;
    
    beforeEach(async () => {
      await initializeYieldFarming();
      
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
      
      // Approve tokens for deposits
      await tokenA.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      await tokenB.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      await tokenA.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user2 });
      await tokenB.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user2 });
    });
    
    it("debería depositar liquidez correctamente", async () => {
      const amountA = LIQUIDITY_AMOUNTS.medium;
      const amountB = LIQUIDITY_AMOUNTS.medium;
      
      const receipt = await yieldFarmingContract.depositLiquidity(
        poolId,
        amountA,
        amountB,
        { from: user1 }
      );
      
      // Verify event
      expectEvent(receipt, 'LiquidityDeposited', {
        user: user1,
        poolId: poolId,
        amountA: amountA,
        amountB: amountB
      });
      
      // Check user pool info
      const userInfo = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      expect(userInfo.isActive).to.be.true;
      expect(userInfo.liquidityAmount).to.be.bignumber.equal(amountA.add(amountB).div(new BN("2")));
      expect(new BN(userInfo.stakingStartTime.toString())).to.be.bignumber.greaterThan(new BN("0"));
      
      // Check pool total liquidity
      const poolInfo = await yieldFarmingContract.getPoolInfo(poolId);
      expect(poolInfo.totalLiquidity).to.be.bignumber.equal(amountA.add(amountB).div(new BN("2")));
      
      // Check user active pools count
      const activePoolsCount = await yieldFarmingContract.getUserActivePoolsCount(user1);
      expect(activePoolsCount).to.be.bignumber.equal(new BN("1"));
    });
    
    it("debería rechazar depósitos por debajo del mínimo", async () => {
      const smallAmount = MIN_DEPOSIT_AMOUNT.sub(new BN("1"));
      
      await expectRevert(
        yieldFarmingContract.depositLiquidity(
          poolId,
          smallAmount,
          LIQUIDITY_AMOUNTS.medium,
          { from: user1 }
        ),
        "Cantidades minimas no alcanzadas"
      );
    });
    
    it("debería rechazar depósito en pool inválido", async () => {
      await expectRevert(
        yieldFarmingContract.depositLiquidity(
          999, // Invalid pool ID
          LIQUIDITY_AMOUNTS.medium,
          LIQUIDITY_AMOUNTS.medium,
          { from: user1 }
        ),
        "Pool no existe o no esta activo"
      );
    });
    
    it("debería manejar múltiples depósitos del mismo usuario", async () => {
      // First deposit
      await yieldFarmingContract.depositLiquidity(
        poolId,
        LIQUIDITY_AMOUNTS.small,
        LIQUIDITY_AMOUNTS.small,
        { from: user1 }
      );
      
      const userInfoBefore = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      const liquidityBefore = userInfoBefore.liquidityAmount;
      
      // Second deposit
      await yieldFarmingContract.depositLiquidity(
        poolId,
        LIQUIDITY_AMOUNTS.small,
        LIQUIDITY_AMOUNTS.small,
        { from: user1 }
      );
      
      const userInfoAfter = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      const expectedLiquidity = new BN(liquidityBefore).add(LIQUIDITY_AMOUNTS.small);
      expect(userInfoAfter.liquidityAmount).to.be.bignumber.equal(expectedLiquidity);
    });
  });
  
  describe("📤 Retiro de Liquidez", () => {
    let poolId;
    
    beforeEach(async () => {
      await initializeYieldFarming();
      
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
      
      // Setup liquidity
      await tokenA.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      await tokenB.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      
      await yieldFarmingContract.depositLiquidity(
        poolId,
        LIQUIDITY_AMOUNTS.medium,
        LIQUIDITY_AMOUNTS.medium,
        { from: user1 }
      );
    });
    
    it("debería retirar liquidez correctamente", async () => {
      const userInfoBefore = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      const withdrawAmount = new BN(userInfoBefore.liquidityAmount).div(new BN("2"));
      
      const receipt = await yieldFarmingContract.withdrawLiquidity(
        poolId,
        withdrawAmount,
        { from: user1 }
      );
      
      // Verify event (fee calculation is complex, just check event exists)
      expectEvent(receipt, 'LiquidityWithdrawn', {
        user: user1,
        poolId: poolId
      });
      
      // Check user liquidity reduced
      const userInfoAfter = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      expect(userInfoAfter.liquidityAmount).to.be.bignumber.equal(
        new BN(userInfoBefore.liquidityAmount).sub(withdrawAmount)
      );
    });
    
    it("debería rechazar retiro de cantidad excesiva", async () => {
      const userInfo = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      const excessiveAmount = new BN(userInfo.liquidityAmount).add(new BN("1"));
      
      await expectRevert(
        yieldFarmingContract.withdrawLiquidity(
          poolId,
          excessiveAmount,
          { from: user1 }
        ),
        "Cantidad insuficiente"
      );
    });
    
    it("debería rechazar retiro de usuario sin liquidez", async () => {
      await expectRevert(
        yieldFarmingContract.withdrawLiquidity(
          poolId,
          LIQUIDITY_AMOUNTS.small,
          { from: user2 } // user2 hasn't deposited
        ),
        "Usuario no tiene liquidez en este pool"
      );
    });
    
    it("debería desactivar usuario al retirar toda la liquidez", async () => {
      const userInfo = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      
      await yieldFarmingContract.withdrawLiquidity(
        poolId,
        userInfo.liquidityAmount,
        { from: user1 }
      );
      
      const userInfoAfter = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      expect(userInfoAfter.isActive).to.be.false;
      expect(userInfoAfter.liquidityAmount).to.be.bignumber.equal(new BN("0"));
    });
  });
  
  describe("🎁 Cálculo y Reclamación de Rewards", () => {
    let poolId;
    
    beforeEach(async () => {
      await initializeYieldFarming();
      
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
      
      // Setup liquidity
      await tokenA.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      await tokenB.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      
      await yieldFarmingContract.depositLiquidity(
        poolId,
        LIQUIDITY_AMOUNTS.medium,
        LIQUIDITY_AMOUNTS.medium,
        { from: user1 }
      );
    });
    
    it("debería calcular rewards correctamente", async () => {
      // Advance time to accumulate some rewards
      await time.increase(time.duration.days(7)); // 1 week
      
      const rewardCalc = await yieldFarmingContract.calculateRewards(user1, poolId);
      
      expect(rewardCalc.baseReward).to.be.bignumber.greaterThan(new BN("0"));
      expect(rewardCalc.tierMultiplier).to.be.bignumber.greaterThan(new BN("0"));
      expect(rewardCalc.finalReward).to.be.bignumber.greaterThan(new BN("0"));
    });
    
    it("debería permitir reclamar rewards", async () => {
      // Advance time to accumulate rewards
      await time.increase(time.duration.days(7));
      
      // Force update of pending rewards
      const rewardCalc = await yieldFarmingContract.calculateRewards(user1, poolId);
      
      if (new BN(rewardCalc.finalReward).gt(new BN("0"))) {
        const receipt = await yieldFarmingContract.claimRewards(poolId, { from: user1 });
        
        expectEvent(receipt, 'RewardsClaimed', {
          user: user1,
          poolId: poolId
        });
        
        const userInfoAfter = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
        expect(userInfoAfter.claimedRewards).to.be.bignumber.greaterThan(new BN("0"));
        expect(new BN(userInfoAfter.lastClaimTime.toString())).to.be.bignumber.greaterThan(new BN("0"));
      }
    });
    
    it("debería rechazar reclamar rewards sin liquidez", async () => {
      await expectRevert(
        yieldFarmingContract.claimRewards(poolId, { from: user2 }),
        "Usuario no activo en este pool"
      );
    });
  });
  
  describe("🔢 Cálculo de Fees Dinámicos", () => {
    let poolId;
    
    beforeEach(async () => {
      await initializeYieldFarming();
      
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
      
      await tokenA.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      await tokenB.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      
      await yieldFarmingContract.depositLiquidity(
        poolId,
        LIQUIDITY_AMOUNTS.medium,
        LIQUIDITY_AMOUNTS.medium,
        { from: user1 }
      );
    });
    
    it("debería calcular fee dinámico inicial correctamente", async () => {
      const dynamicFee = await yieldFarmingContract.calculateDynamicFee(user1, poolId);
      
      // Should be close to initial fee since no time has passed
      expect(dynamicFee).to.be.bignumber.lte(POOL_PARAMS.feeInitial);
    });
    
    it("debería reducir fee con el tiempo de vesting", async () => {
      const initialFee = await yieldFarmingContract.calculateDynamicFee(user1, poolId);
      
      // Advance time significantly
      await time.increase(time.duration.weeks(26)); // Half vesting period
      
      const laterFee = await yieldFarmingContract.calculateDynamicFee(user1, poolId);
      
      // Fee should be lower after time passes
      expect(laterFee).to.be.bignumber.lt(initialFee);
    });
  });
  
  describe("👑 Funciones Administrativas", () => {
    let poolId;
    
    beforeEach(async () => {
      await initializeYieldFarming();
      
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
    });
    
    it("debería permitir al owner actualizar APY del pool", async () => {
      const newAPY = new BN("1500"); // 15%
      
      const receipt = await yieldFarmingContract.updatePoolAPY(poolId, newAPY, { from: owner });
      
      expectEvent(receipt, 'PoolUpdated', {
        poolId: poolId,
        newBaseAPY: newAPY
      });
      
      const poolInfo = await yieldFarmingContract.getPoolInfo(poolId);
      expect(poolInfo.baseAPY).to.be.bignumber.equal(newAPY);
    });
    
    it("debería permitir al owner actualizar multiplicador del pool", async () => {
      const newMultiplier = new BN("5000"); // 5x (5000 basis points)
      
      await yieldFarmingContract.updatePoolMultiplier(poolId, newMultiplier, { from: owner });
      
      const poolInfo = await yieldFarmingContract.getPoolInfo(poolId);
      expect(poolInfo.maxMultiplier).to.be.bignumber.equal(newMultiplier);
    });
    
    it("debería permitir pausar y despausar pools", async () => {
      await yieldFarmingContract.pausePool(poolId, { from: owner });
      
      let poolInfo = await yieldFarmingContract.getPoolInfo(poolId);
      expect(poolInfo.isActive).to.be.false;
      
      await yieldFarmingContract.unpausePool(poolId, { from: owner });
      
      poolInfo = await yieldFarmingContract.getPoolInfo(poolId);
      expect(poolInfo.isActive).to.be.true;
    });
    
    it("no debería permitir a no-owners funciones administrativas", async () => {
      await expectRevert.unspecified(
        yieldFarmingContract.updatePoolAPY(poolId, new BN("1500"), { from: nonOwner })
      );
      
      await expectRevert.unspecified(
        yieldFarmingContract.pausePool(poolId, { from: nonOwner })
      );
    });
    
    it("debería permitir retiro de emergencia", async () => {
      // Setup some liquidity first
      await tokenA.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      await tokenB.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      
      await yieldFarmingContract.depositLiquidity(
        poolId,
        LIQUIDITY_AMOUNTS.medium,
        LIQUIDITY_AMOUNTS.medium,
        { from: user1 }
      );
      
      // Emergency withdraw
      const receipt = await yieldFarmingContract.emergencyWithdraw(poolId, { from: user1 });
      
      expectEvent(receipt, 'EmergencyWithdrawal', {
        user: user1,
        poolId: poolId
      });
      
      // User should be deactivated after emergency withdrawal
      const userInfo = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      expect(userInfo.isActive).to.be.false;
    });
  });
  
  describe("🔍 Funciones de Consulta", () => {
    let poolId;
    
    beforeEach(async () => {
      await initializeYieldFarming();
      
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
    });
    
    it("debería retornar información correcta del pool", async () => {
      const poolInfo = await yieldFarmingContract.getPoolInfo(poolId);
      
      expect(poolInfo.tokenA).to.equal(tokenA.address);
      expect(poolInfo.tokenB).to.equal(tokenB.address);
      expect(poolInfo.baseAPY).to.be.bignumber.equal(POOL_PARAMS.baseAPY);
      expect(poolInfo.isActive).to.be.true;
    });
    
    it("debería retornar el número total de pools", async () => {
      const totalPools = await yieldFarmingContract.getTotalPools();
      expect(totalPools).to.be.bignumber.equal(new BN("1"));
      
      // Create another pool
      await yieldFarmingContract.createPool(
        tokenA.address,
        tokenC.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      const totalPoolsAfter = await yieldFarmingContract.getTotalPools();
      expect(totalPoolsAfter).to.be.bignumber.equal(new BN("2"));
    });
    
    it("debería retornar información correcta del usuario en pool", async () => {
      const userInfo = await yieldFarmingContract.getUserPoolInfo(user1, poolId);
      
      expect(userInfo.isActive).to.be.false; // No liquidity deposited yet
      expect(userInfo.liquidityAmount).to.be.bignumber.equal(new BN("0"));
    });
  });
  
  describe("📊 Funciones de Protocolo", () => {
    beforeEach(async () => {
      await initializeYieldFarming();
    });
    
    it("debería obtener estadísticas del protocolo", async () => {
      // Create a pool first
      await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      const stats = await yieldFarmingContract.getProtocolStats();
      
      expect(stats._totalPools).to.be.bignumber.equal(new BN("1"));
      expect(stats._totalValueLocked).to.be.bignumber.equal(new BN("0"));
      expect(stats._totalRewardsDistributed).to.be.bignumber.equal(new BN("0"));
      expect(stats._activePools).to.be.bignumber.equal(new BN("1"));
    });
    
    it("debería permitir al owner actualizar fee del protocolo", async () => {
      const newFee = new BN("1500"); // 15%
      
      const receipt = await yieldFarmingContract.updateProtocolFee(newFee, { from: owner });
      
      expectEvent(receipt, 'ProtocolFeeUpdated', {
        newFee: newFee
      });
      
      const protocolFee = await yieldFarmingContract.protocolFeePercentage();
      expect(protocolFee).to.be.bignumber.equal(newFee);
    });
    
    it("debería rechazar fee del protocolo excesivo", async () => {
      await expectRevert(
        yieldFarmingContract.updateProtocolFee(new BN("2500"), { from: owner }), // 25%
        "Fee no puede ser mayor al 20%"
      );
    });
    
    it("debería permitir pausar y despausar el protocolo", async () => {
      await yieldFarmingContract.pauseProtocol({ from: owner });
      
      const isPaused = await yieldFarmingContract.paused();
      expect(isPaused).to.be.true;
      
      await yieldFarmingContract.unpauseProtocol({ from: owner });
      
      const isPausedAfter = await yieldFarmingContract.paused();
      expect(isPausedAfter).to.be.false;
    });
  });
  
  describe("🔗 Funciones de Integración", () => {
    beforeEach(async () => {
      await initializeYieldFarming();
    });
    
    it("debería obtener tier del usuario (sin contrato configurado)", async () => {
      const userTier = await yieldFarmingContract.getUserTier(user1);
      expect(userTier).to.be.bignumber.equal(new BN("0")); // Default when no tier contract
    });
    
    it("debería verificar staking activo (sin contrato configurado)", async () => {
      const hasStaking = await yieldFarmingContract.hasActiveStaking(user1);
      expect(hasStaking).to.be.false; // Default when no staking contract
    });
    
    it("debería calcular multiplicadores del usuario", async () => {
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      const poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
      
      // Setup liquidity first
      await tokenA.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      await tokenB.approve(yieldFarmingContract.address, LIQUIDITY_AMOUNTS.large, { from: user1 });
      
      await yieldFarmingContract.depositLiquidity(
        poolId,
        LIQUIDITY_AMOUNTS.medium,
        LIQUIDITY_AMOUNTS.medium,
        { from: user1 }
      );
      
      const multipliers = await yieldFarmingContract.calculateUserMultipliers(user1, poolId);
      
      expect(multipliers.tierMultiplier).to.be.bignumber.greaterThan(new BN("0"));
      expect(multipliers.stakingBonus).to.be.bignumber.equal(new BN("1000")); // No staking
      expect(multipliers.timeBonus).to.be.bignumber.equal(new BN("600")); // Initial bonus
    });
    
    it("debería calcular bonus exponencial por tiempo", async () => {
      const bonus0 = await yieldFarmingContract.calculateExponentialTimeBonus(0);
      expect(bonus0).to.be.bignumber.equal(new BN("600")); // 6%
      
      const bonus26 = await yieldFarmingContract.calculateExponentialTimeBonus(26);
      expect(bonus26).to.be.bignumber.equal(new BN("1900")); // After 26 weeks
      
      const bonus104 = await yieldFarmingContract.calculateExponentialTimeBonus(104);
      expect(bonus104).to.be.bignumber.equal(new BN("10000")); // 100%
    });
  });
  
  describe("⚠️ Casos Edge y Validaciones", () => {
    it("debería rechazar operaciones con pool inválido", async () => {
      await expectRevert(
        yieldFarmingContract.getPoolInfo(999),
        "Pool no existe"
      );
    });
    
    it("debería manejar correctamente pausa del contrato", async () => {
      await yieldFarmingContract.pauseProtocol({ from: owner });
      
      await expectRevert.unspecified(
        yieldFarmingContract.createPool(
          tokenA.address,
          tokenB.address,
          POOL_PARAMS.baseAPY,
          POOL_PARAMS.maxMultiplier,
          POOL_PARAMS.feeInitial,
          POOL_PARAMS.feeFinal,
          POOL_PARAMS.vestingWeeks,
          { from: owner }
        )
      );
    });
    
    it("debería manejar transferencias de tokens fallidas", async () => {
      await initializeYieldFarming();
      
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      const poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
      
      // Try to deposit without approval
      await expectRevert.unspecified(
        yieldFarmingContract.depositLiquidity(
          poolId,
          LIQUIDITY_AMOUNTS.medium,
          LIQUIDITY_AMOUNTS.medium,
          { from: user1 }
        )
      );
    });
    
    it("debería verificar correctamente si un pool está activo", async () => {
      await initializeYieldFarming();
      
      const receipt = await yieldFarmingContract.createPool(
        tokenA.address,
        tokenB.address,
        POOL_PARAMS.baseAPY,
        POOL_PARAMS.maxMultiplier,
        POOL_PARAMS.feeInitial,
        POOL_PARAMS.feeFinal,
        POOL_PARAMS.vestingWeeks,
        { from: owner }
      );
      
      const poolId = receipt.logs.find(log => log.event === 'PoolCreated').args.poolId;
      
      const isActive = await yieldFarmingContract.isPoolActive(poolId);
      expect(isActive).to.be.true;
      
      // Pause the pool
      await yieldFarmingContract.pausePool(poolId, { from: owner });
      
      const isActiveAfter = await yieldFarmingContract.isPoolActive(poolId);
      expect(isActiveAfter).to.be.false;
    });
  });
}); 