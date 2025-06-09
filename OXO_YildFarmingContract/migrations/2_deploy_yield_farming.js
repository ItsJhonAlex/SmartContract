const YieldMath = artifacts.require("YieldMath");
const OXSYieldFarming = artifacts.require("OXSYieldFarming");
const MockERC20 = artifacts.require("MockERC20");

module.exports = async function (deployer, network, accounts) {
  // En desarrollo, usamos la cuenta del desplegador como owner
  const owner = accounts[0];
  
  console.log("🚀 Desplegando sistema de Yield Farming de OXO...");
  console.log("👤 Owner:", owner);
  console.log("🌐 Network:", network);
  
  try {
    // 1. Desplegar la biblioteca YieldMath
    console.log("📚 Desplegando biblioteca YieldMath...");
    await deployer.deploy(YieldMath);
    const yieldMathLib = await YieldMath.deployed();
    console.log("✅ YieldMath desplegada en:", yieldMathLib.address);
    
    // 2. Enlazar la biblioteca con el contrato principal
    console.log("🔗 Enlazando YieldMath con OXSYieldFarming...");
    await deployer.link(YieldMath, OXSYieldFarming);
    
    // 3. Desplegar el contrato principal de Yield Farming
    console.log("🌾 Desplegando contrato OXSYieldFarming...");
    await deployer.deploy(OXSYieldFarming, owner);
    const yieldFarmingContract = await OXSYieldFarming.deployed();
    console.log("✅ OXSYieldFarming desplegado en:", yieldFarmingContract.address);
    
    // 4. Deploy mock tokens for testing
    if (network === 'development' || network === 'develop' || network === 'test') {
      console.log("🪙 Desplegando tokens mock para testing...");
      
      // Deploy OXS mock token
      await deployer.deploy(MockERC20, "Mock OXS Token", "MOXS", 18);
      const oxsToken = await MockERC20.deployed();
      console.log("✅ Mock OXS Token desplegado en:", oxsToken.address);
      
      // Deploy TokenA for liquidity pools
      await deployer.deploy(MockERC20, "Mock Token A", "MTKA", 18);
      const tokenA = await MockERC20.deployed();
      console.log("✅ Mock Token A desplegado en:", tokenA.address);
      
      // Deploy TokenB for liquidity pools  
      await deployer.deploy(MockERC20, "Mock Token B", "MTKB", 18);
      const tokenB = await MockERC20.deployed();
      console.log("✅ Mock Token B desplegado en:", tokenB.address);
      
      console.log("⚠️  IMPORTANTE para desarrollo:");
      console.log("   - Usando MockERC20 para testing");
      console.log("   - OXS Token Address:", oxsToken.address);
      console.log("   - Token A Address:", tokenA.address);
      console.log("   - Token B Address:", tokenB.address);
    }
    
    console.log("\n🎉 ¡Despliegue completado exitosamente!");
    console.log("📊 Estadísticas del despliegue:");
    console.log("   - YieldMath Library:", yieldMathLib.address);
    console.log("   - OXSYieldFarming Contract:", yieldFarmingContract.address);
    console.log("   - Owner:", owner);
    console.log("\n🔄 Próximos pasos:");
    console.log("   1. Actualizar direcciones de OXS Token, Staking y Tier contracts");
    console.log("   2. Llamar a initializeContracts() con las direcciones correctas");
    console.log("   3. Crear pools de liquidez iniciales");
    console.log("   4. Configurar parameters de protocolo");
    
  } catch (error) {
    console.error("❌ Error durante el despliegue:", error);
    throw error;
  }
}; 