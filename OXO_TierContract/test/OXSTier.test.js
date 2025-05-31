const OXSTier = artifacts.require("OXSTier");
const MockERC20 = artifacts.require("MockERC20");

const { expectRevert, expectEvent, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("OXSTier", accounts => {
  const [owner, user1, user2] = accounts;
  let tierContract;
  let mockToken;
  
  const TIER_NAMES = ["Elevator", "Premium Elevator", "VIP ELEVATOR"];
  const TIER_REQUIREMENTS = [
    new BN("2000000000000000000000"), // 2000 tokens
    new BN("10000000000000000000000"), // 10000 tokens
    new BN("34000000000000000000000")  // 34000 tokens
  ];
  const TIER_CASH_VALUES = [300, 1500, 5100];
  
  beforeEach(async () => {
    // Desplegamos el token mock
    mockToken = await MockERC20.new("Mock OXS", "MOXS", 18);
    
    // Desplegamos el contrato de Tiers
    tierContract = await OXSTier.new(mockToken.address);
    
    // Mint tokens para testing
    await mockToken.mint(user1, TIER_REQUIREMENTS[2]); // Suficiente para el tier más alto
    await mockToken.mint(user2, TIER_REQUIREMENTS[0]); // Suficiente para el tier más bajo
  });
  
  describe("🔧 Inicialización", () => {
    it("debería inicializar correctamente con los tiers por defecto", async () => {
      for (let i = 1; i <= 3; i++) {
        const tierInfo = await tierContract.getTierInfo(i);
        expect(tierInfo.name).to.equal(TIER_NAMES[i-1]);
        expect(tierInfo.requiredTokens).to.be.bignumber.equal(TIER_REQUIREMENTS[i-1]);
        expect(tierInfo.cashValue).to.be.bignumber.equal(new BN(TIER_CASH_VALUES[i-1]));
        expect(tierInfo.isActive).to.be.true;
      }
    });
  });
  
  describe("👤 Gestión de Tiers", () => {
    it("debería actualizar correctamente el tier de un usuario", async () => {
      // Aprobamos y transferimos tokens
      await mockToken.approve(tierContract.address, TIER_REQUIREMENTS[1], { from: user1 });
      
      // Actualizamos el tier
      await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[1], { from: user1 });
      
      const userInfo = await tierContract.getUserTierInfo(user1);
      expect(userInfo.currentTier).to.be.bignumber.equal(new BN("2")); // Premium Elevator
    });
    
    it("debería calcular correctamente el tier basado en el stake", async () => {
      // Test para tier 1
      let tier = await tierContract.calculateTier(TIER_REQUIREMENTS[0]);
      expect(tier).to.be.bignumber.equal(new BN("1"));
      
      // Test para tier 2
      tier = await tierContract.calculateTier(TIER_REQUIREMENTS[1]);
      expect(tier).to.be.bignumber.equal(new BN("2"));
      
      // Test para tier 3
      tier = await tierContract.calculateTier(TIER_REQUIREMENTS[2]);
      expect(tier).to.be.bignumber.equal(new BN("3"));
    });
  });
  
  describe("👑 Funciones de Owner", () => {
    it("debería permitir al owner añadir un nuevo tier", async () => {
      const newTierName = "Super VIP";
      const newRequiredTokens = new BN("50000000000000000000000"); // 50000 tokens
      const newCashValue = 7500;
      const newConversionRate = new BN("11000000000000"); // 0.011
      
      await tierContract.addTier(
        newTierName,
        newRequiredTokens,
        newCashValue,
        newConversionRate,
        { from: owner }
      );
      
      const tierInfo = await tierContract.getTierInfo(4);
      expect(tierInfo.name).to.equal(newTierName);
      expect(tierInfo.requiredTokens).to.be.bignumber.equal(newRequiredTokens);
      expect(tierInfo.cashValue).to.be.bignumber.equal(new BN(newCashValue));
    });
    
    it("debería permitir al owner modificar un tier existente", async () => {
      const newName = "Elevator Plus";
      const newRequiredTokens = new BN("2500000000000000000000"); // 2500 tokens
      const newCashValue = 375;
      const newConversionRate = new BN("10100000000000"); // 0.0101
      
      await tierContract.updateTier(
        1,
        newName,
        newRequiredTokens,
        newCashValue,
        newConversionRate,
        { from: owner }
      );
      
      const tierInfo = await tierContract.getTierInfo(1);
      expect(tierInfo.name).to.equal(newName);
      expect(tierInfo.requiredTokens).to.be.bignumber.equal(newRequiredTokens);
      expect(tierInfo.cashValue).to.be.bignumber.equal(new BN(newCashValue));
    });
    
    it("no debería permitir a no-owners modificar tiers", async () => {
      await expectRevert(
        tierContract.updateTier(
          1,
          "New Name",
          TIER_REQUIREMENTS[0],
          TIER_CASH_VALUES[0],
          new BN("10000000000000"),
          { from: user1 }
        ),
        "Ownable: caller is not the owner"
      );
    });
  });
  
  describe("💰 Funciones de Consulta", () => {
    it("debería retornar el valor en efectivo correcto del tier", async () => {
      await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[1], { from: user1 });
      const cashValue = await tierContract.getUserTierCashValue(user1);
      expect(cashValue).to.be.bignumber.equal(new BN(TIER_CASH_VALUES[1]));
    });
    
    it("debería verificar correctamente si un usuario califica para un tier", async () => {
      await tierContract.updateUserTier(user1, TIER_REQUIREMENTS[2], { from: user1 });
      
      const qualifiesForTier1 = await tierContract.qualifiesForTier(user1, 1);
      const qualifiesForTier2 = await tierContract.qualifiesForTier(user1, 2);
      const qualifiesForTier3 = await tierContract.qualifiesForTier(user1, 3);
      
      expect(qualifiesForTier1).to.be.true;
      expect(qualifiesForTier2).to.be.true;
      expect(qualifiesForTier3).to.be.true;
    });
  });
}); 