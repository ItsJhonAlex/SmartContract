const OXSTier = artifacts.require("OXSTier");
const MockERC20 = artifacts.require("MockERC20");

const { expectRevert, expectEvent, BN, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("OXSTier - Complete Test Suite", accounts => {
  const [owner, user1, user2, user3, nonOwner] = accounts;
  let tierContract;
  let mockToken;
  
  // Tier constants para testing
  const TIER_NAMES = ["Elevator", "Premium Elevator", "VIP ELEVATOR"];
  const TIER_REQUIREMENTS = [
    new BN("2000000000000000000000"), // 2000 tokens
    new BN("10000000000000000000000"), // 10000 tokens  
    new BN("34000000000000000000000")  // 34000 tokens
  ];
  const TIER_CASH_VALUES = [300, 1500, 5100];
  const TIER_CONVERSION_RATES = [
    new BN("600"), // Initial rate as defined in BaseModule
    new BN("600"), // Initial rate as defined in BaseModule
    new BN("600")  // Initial rate as defined in BaseModule
  ];
  
  beforeEach(async () => {
    // Deploy MockERC20
    mockToken = await MockERC20.new("Mock OXS", "MOXS", 18, { from: owner });
    
    // Deploy OXSTier contract
    tierContract = await OXSTier.new(mockToken.address, { from: owner });
    
    // Mint tokens for testing
    await mockToken.mint(user1, TIER_REQUIREMENTS[2], { from: owner }); // Max tier amount
    await mockToken.mint(user2, TIER_REQUIREMENTS[1], { from: owner }); // Mid tier amount  
    await mockToken.mint(user3, TIER_REQUIREMENTS[0], { from: owner }); // Min tier amount
  });
  
  describe("🔧 Inicialización y Configuración Básica", () => {
    it("debería inicializar correctamente con los tiers por defecto", async () => {
      for (let i = 1; i <= 3; i++) {
        const tierInfo = await tierContract.getTierInfo(i);
        expect(tierInfo.name).to.equal(TIER_NAMES[i-1]);
        expect(tierInfo.requiredTokens).to.be.bignumber.equal(TIER_REQUIREMENTS[i-1]);
        expect(tierInfo.cashValue).to.be.bignumber.equal(new BN(TIER_CASH_VALUES[i-1]));
        expect(tierInfo.isActive).to.be.true;
      }
    });
    
    it("debería configurar correctamente la dirección del token", async () => {
      const tokenAddress = await tierContract.oxsToken();
      expect(tokenAddress).to.equal(mockToken.address);
    });
    
    it("debería rechazar inicialización con dirección de token inválida", async () => {
      await expectRevert(
        OXSTier.new("0x0000000000000000000000000000000000000000", { from: owner }),
        "Direccion de token invalida"
      );
    });
  });
  
  describe("🧮 Cálculo de Tiers", () => {
    it("debería calcular correctamente el tier basado en el stake", async () => {
      // Test para tier 0 (sin stake)
      let tier = await tierContract.calculateTier(0);
      expect(tier).to.be.bignumber.equal(new BN("0"));
      
      // Test para tier 1
      tier = await tierContract.calculateTier(TIER_REQUIREMENTS[0]);
      expect(tier).to.be.bignumber.equal(new BN("1"));
      
      // Test para tier 2
      tier = await tierContract.calculateTier(TIER_REQUIREMENTS[1]);
      expect(tier).to.be.bignumber.equal(new BN("2"));
      
      // Test para tier 3
      tier = await tierContract.calculateTier(TIER_REQUIREMENTS[2]);
      expect(tier).to.be.bignumber.equal(new BN("3"));
      
      // Test para cantidad intermedia
      const intermediateAmount = TIER_REQUIREMENTS[1].add(new BN("1000000000000000000000")); // 11000 tokens
      tier = await tierContract.calculateTier(intermediateAmount);
      expect(tier).to.be.bignumber.equal(new BN("2")); // Debe seguir siendo tier 2
    });
    
    it("debería manejar correctamente cantidades muy grandes", async () => {
      const hugeAmount = new BN("100000000000000000000000000"); // 100M tokens
      const tier = await tierContract.calculateTier(hugeAmount);
      expect(tier).to.be.bignumber.equal(new BN("3")); // Máximo tier 3
    });
  });
  
  describe("👤 Gestión de Usuarios", () => {
    beforeEach(async () => {
      // Approve tokens for tier updates
      await mockToken.approve(tierContract.address, TIER_REQUIREMENTS[2], { from: user1 });
      await mockToken.approve(tierContract.address, TIER_REQUIREMENTS[1], { from: user2 });
      await mockToken.approve(tierContract.address, TIER_REQUIREMENTS[0], { from: user3 });
    });
    
    it("debería actualizar correctamente el tier de un usuario", async () => {
      // Update tier for user1
      const receipt = await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[1], { from: user1 });
      
      // Verify tier updated event
      expectEvent(receipt, 'TierUpdated', {
        user: user1,
        oldTier: new BN("0"),
        newTier: new BN("2")
      });
      
      // Check user tier info
      const userInfo = await tierContract.getUserTierInfo(user1);
      expect(userInfo.tierId).to.be.bignumber.equal(new BN("2"));
      expect(userInfo.stakedAmount).to.be.bignumber.equal(TIER_REQUIREMENTS[1]);
      expect(userInfo.isActive).to.be.true;
    });
    
    it("debería actualizar la cantidad stakeada sin cambiar tier", async () => {
      // Initial update
      await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[1], { from: user1 });
      
      // Update with different amount but same tier
      const newAmount = TIER_REQUIREMENTS[1].add(new BN("1000000000000000000000")); // +1000 tokens
      await tierContract.updateUserTier(user1, newAmount, { from: user1 });
      
      const userInfo = await tierContract.getUserTierInfo(user1);
      expect(userInfo.tierId).to.be.bignumber.equal(new BN("2")); // Same tier
      expect(userInfo.stakedAmount).to.be.bignumber.equal(newAmount); // Updated amount
    });
    
    it("debería registrar el tiempo de staking en la primera actualización", async () => {
      await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[0], { from: user1 });
      
      const stakingWeeks = await tierContract.getUserStakingWeeks(user1);
      expect(stakingWeeks).to.be.bignumber.equal(new BN("0")); // Just started
      
      const stakingStart = await tierContract.userStakingStart(user1);
      expect(new BN(stakingStart.toString())).to.be.bignumber.greaterThan(new BN("0")); // Should be set to a timestamp
    });
    
    it("debería manejar correctamente la desactivación de usuarios", async () => {
      // Activate user
      await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[1], { from: user1 });
      
      // Deactivate user (stake 0)
      await tierContract.updateUserTier(user1, 0, { from: user1 });
      
      const userInfo = await tierContract.getUserTierInfo(user1);
      expect(userInfo.tierId).to.be.bignumber.equal(new BN("0"));
      expect(userInfo.isActive).to.be.false;
    });
  });
  
  describe("🏆 Funciones de Administración de Tiers", () => {
    it("debería rechazar agregar tier cuando se alcanza el máximo", async () => {
      const newTierName = "Super VIP";
      const newRequiredTokens = new BN("50000000000000000000000"); // 50000 tokens
      const newCashValue = 7500;
      const newConversionRate = new BN("600"); // Matching the initial rate
      
      // This should fail because there are already 3 tiers and MAX_TIERS might be 3
      await expectRevert(
        tierContract.addTier(
          newTierName,
          newRequiredTokens,
          newCashValue,
          newConversionRate,
          { from: owner }
        ),
        "Maximo numero de Tiers alcanzado"
      );
    });
    
    it("debería permitir al owner modificar un tier existente", async () => {
      const newName = "Elevator Plus";
      const newRequiredTokens = new BN("2500000000000000000000"); // 2500 tokens
      const newCashValue = 375;
      const newConversionRate = new BN("10100000000000"); // 0.0101
      
      const receipt = await tierContract.updateTier(
        1,
        newName,
        newRequiredTokens,
        newCashValue,
        newConversionRate,
        { from: owner }
      );
      
      // Verify event
      expectEvent(receipt, 'TierModified', {
        tierId: new BN("1"),
        name: newName,
        requiredTokens: newRequiredTokens,
        cashValue: new BN(newCashValue)
      });
      
      // Check updated tier info
      const tierInfo = await tierContract.getTierInfo(1);
      expect(tierInfo.name).to.equal(newName);
      expect(tierInfo.requiredTokens).to.be.bignumber.equal(newRequiredTokens);
      expect(tierInfo.cashValue).to.be.bignumber.equal(new BN(newCashValue));
      expect(tierInfo.conversionRate).to.be.bignumber.equal(newConversionRate);
    });
    
    it("no debería permitir a no-owners modificar tiers", async () => {
      await expectRevert.unspecified(
        tierContract.updateTier(
          1,
          "New Name",
          TIER_REQUIREMENTS[0],
          TIER_CASH_VALUES[0],
          TIER_CONVERSION_RATES[0],
          { from: nonOwner }
        )
      );
    });
    
    it("debería rechazar modificar un tier inválido", async () => {
      await expectRevert(
        tierContract.updateTier(
          99,
          "Invalid Tier",
          TIER_REQUIREMENTS[0],
          TIER_CASH_VALUES[0],
          TIER_CONVERSION_RATES[0],
          { from: owner }
        ),
        "Tier invalido"
      );
    });
  });
  
  describe("💰 Funciones de Consulta", () => {
    beforeEach(async () => {
      await mockToken.approve(tierContract.address, TIER_REQUIREMENTS[2], { from: user1 });
      await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[1], { from: user1 });
    });
    
    it("debería retornar el valor en efectivo correcto del tier", async () => {
      const cashValue = await tierContract.getUserTierCashValue(user1);
      expect(cashValue).to.be.bignumber.equal(new BN(TIER_CASH_VALUES[1])); // Tier 2
    });
    
    it("debería retornar la conversion rate base correcta", async () => {
      const baseRate = await tierContract.getUserTierConversionRate(user1);
      expect(baseRate).to.be.bignumber.equal(TIER_CONVERSION_RATES[1]); // Tier 2 base rate
    });
    
    it("debería verificar correctamente si un usuario califica para un tier", async () => {
      const qualifiesForTier1 = await tierContract.qualifiesForTier(user1, 1);
      const qualifiesForTier2 = await tierContract.qualifiesForTier(user1, 2);
      const qualifiesForTier3 = await tierContract.qualifiesForTier(user1, 3);
      
      expect(qualifiesForTier1).to.be.true;
      expect(qualifiesForTier2).to.be.true;
      expect(qualifiesForTier3).to.be.false; // User1 has tier 2 amount
    });
    
    it("debería obtener información completa del tier de un usuario", async () => {
      const completeInfo = await tierContract.getUserTierCompleteInfo(user1);
      
      expect(completeInfo.tierName).to.equal(TIER_NAMES[1]); // Tier 2
      expect(completeInfo.tierId).to.be.bignumber.equal(new BN("2"));
      expect(completeInfo.stakedAmount).to.be.bignumber.equal(TIER_REQUIREMENTS[1]);
      expect(completeInfo.cashValue).to.be.bignumber.equal(new BN(TIER_CASH_VALUES[1]));
      expect(completeInfo.baseConversionRate).to.be.bignumber.equal(TIER_CONVERSION_RATES[1]);
      expect(completeInfo.stakingWeeks).to.be.bignumber.equal(new BN("0")); // Just started
      expect(completeInfo.isActive).to.be.true;
    });
    
    it("debería manejar usuarios sin tier", async () => {
      const completeInfo = await tierContract.getUserTierCompleteInfo(user2); // No tier yet
      
      expect(completeInfo.tierName).to.equal("No Tier");
      expect(completeInfo.tierId).to.be.bignumber.equal(new BN("0"));
      expect(completeInfo.stakedAmount).to.be.bignumber.equal(new BN("0"));
      expect(completeInfo.isActive).to.be.false;
    });
  });
  
  describe("📊 Funciones de Progresión Temporal", () => {
    it("debería simular conversion rates para diferentes semanas", async () => {
      const week1Rate = await tierContract.simulateConversionRateForWeeks(1);
      const week10Rate = await tierContract.simulateConversionRateForWeeks(10);
      const week52Rate = await tierContract.simulateConversionRateForWeeks(52);
      
      expect(week10Rate).to.be.bignumber.greaterThan(week1Rate);
      expect(week52Rate).to.be.bignumber.greaterThan(week10Rate);
    });
    
    it("debería obtener progresión de conversion rates", async () => {
      const progression = await tierContract.getConversionRateProgression(1, 10);
      
      expect(progression.length).to.equal(10);
      
      // Verify progression is increasing
      for (let i = 1; i < progression.length; i++) {
        expect(progression[i]).to.be.bignumber.greaterThan(progression[i-1]);
      }
    });
    
    it("debería rechazar rango de progresión demasiado grande", async () => {
      await expectRevert(
        tierContract.getConversionRateProgression(1, 60),
        "Rango demasiado grande, maximo 50 semanas"
      );
    });
    
    it("debería rechazar semana final que exceda el límite", async () => {
      await expectRevert(
        tierContract.getConversionRateProgression(100, 110),
        "Semana final no puede exceder 104"
      );
    });
  });
  
  describe("🔍 Funciones de Balance", () => {
    it("debería obtener el balance de tokens correctamente", async () => {
      const balance = await tierContract.getTokenBalance(user1);
      expect(balance).to.be.bignumber.equal(TIER_REQUIREMENTS[2]);
    });
    
    it("debería obtener el balance stakeado correctamente", async () => {
      await mockToken.approve(tierContract.address, TIER_REQUIREMENTS[1], { from: user1 });
      await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[1], { from: user1 });
      
      const stakedBalance = await tierContract.getStakedBalance(user1);
      expect(stakedBalance).to.be.bignumber.equal(TIER_REQUIREMENTS[1]);
    });
  });
  
  describe("⚠️ Casos Edge y Validaciones", () => {
    it("debería rechazar direcciones inválidas", async () => {
      await expectRevert(
        tierContract.updateUserTier("0x0000000000000000000000000000000000000000", 1000, { from: owner }),
        "Direccion invalida"
      );
    });
    
    it("debería rechazar consultas de tiers inválidos", async () => {
      await expectRevert(
        tierContract.getTierInfo(0),
        "Tier invalido"
      );
      
      await expectRevert(
        tierContract.getTierInfo(99),
        "Tier invalido"
      );
    });
    
    it("debería rechazar verificación de tiers inválidos", async () => {
      await expectRevert(
        tierContract.qualifiesForTier(user1, 0),
        "Tier invalido"
      );
      
      await expectRevert(
        tierContract.qualifiesForTier(user1, 99),
        "Tier invalido"
      );
    });
  });
}); 