const OXSYieldFarming = artifacts.require("OXSYieldFarming");
const MockERC20 = artifacts.require("MockERC20");

const { BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("OXSYieldFarming - Simple Test", accounts => {
  const [owner, user1] = accounts;
  let yieldFarmingContract;
  let oxsToken;
  
  beforeEach(async () => {
    // Deploy YieldFarming contract
    yieldFarmingContract = await OXSYieldFarming.new(owner, { from: owner });
    
    // Deploy mock token
    oxsToken = await MockERC20.new("Mock OXS", "MOXS", 18, { from: owner });
  });
  
  it("debería inicializar correctamente", async () => {
    const totalPools = await yieldFarmingContract.getTotalPools();
    expect(totalPools).to.be.bignumber.equal(new BN("0"));
  });
  
  it("debería permitir inicializar contratos", async () => {
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
  });
}); 