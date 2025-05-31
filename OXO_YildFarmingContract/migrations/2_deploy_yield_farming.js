const YieldMath = artifacts.require("YieldMath");
const OXSYieldFarming = artifacts.require("OXSYieldFarming");

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
    
    // 4. Configuraciones iniciales para desarrollo
    if (network === 'development' || network === 'develop') {
      console.log("⚙️ Configurando contratos para desarrollo...");
      
      // Direcciones de ejemplo para testing (deben ser reemplazadas en producción)
      const oxsTokenAddress = "0x0000000000000000000000000000000000000000"; // TODO: Reemplazar
      const stakingContractAddress = "0x0000000000000000000000000000000000000000"; // TODO: Reemplazar  
      const tierContractAddress = "0x0000000000000000000000000000000000000000"; // TODO: Reemplazar
      
      console.log("⚠️  IMPORTANTE: Actualizar direcciones de contratos después del despliegue:");
      console.log("   - OXS Token Address:", oxsTokenAddress);
      console.log("   - Staking Contract Address:", stakingContractAddress);
      console.log("   - Tier Contract Address:", tierContractAddress);
      
      // Para testing, inicializamos con direcciones dummy (se pueden actualizar después)
      // await yieldFarmingContract.initializeContracts(
      //   oxsTokenAddress,
      //   stakingContractAddress,
      //   tierContractAddress,
      //   { from: owner }
      // );
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