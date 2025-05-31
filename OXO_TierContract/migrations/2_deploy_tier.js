const LogarithmLib = artifacts.require("LogarithmLib");
const OXSTier = artifacts.require("OXSTier");

module.exports = async function (deployer, network, accounts) {
  // En desarrollo, usamos la cuenta del desplegador como owner
  const owner = accounts[0];
  
  console.log("🏆 Desplegando sistema de Tiers de OXO...");
  console.log("👤 Owner:", owner);
  console.log("🌐 Network:", network);
  
  try {
    // 1. Desplegar la biblioteca LogarithmLib
    console.log("📚 Desplegando biblioteca LogarithmLib...");
    await deployer.deploy(LogarithmLib);
    const logarithmLib = await LogarithmLib.deployed();
    console.log("✅ LogarithmLib desplegada en:", logarithmLib.address);
    
    // 2. Enlazar la biblioteca con el contrato principal
    console.log("🔗 Enlazando LogarithmLib con OXSTier...");
    await deployer.link(LogarithmLib, OXSTier);
    
    // 3. Dirección del token OXS (debe ser actualizada en producción)
    const oxsTokenAddress = network === 'development' 
      ? "0x0000000000000000000000000000000000000000" // TODO: Reemplazar en desarrollo
      : "0x..."; // TODO: Dirección real del token en producción
    
    // 4. Desplegar el contrato principal de Tiers
    console.log("🏆 Desplegando contrato OXSTier...");
    await deployer.deploy(OXSTier, oxsTokenAddress);
    const tierContract = await OXSTier.deployed();
    console.log("✅ OXSTier desplegado en:", tierContract.address);
    
    console.log("\n🎉 ¡Despliegue completado exitosamente!");
    console.log("📊 Estadísticas del despliegue:");
    console.log("   - LogarithmLib Library:", logarithmLib.address);
    console.log("   - OXSTier Contract:", tierContract.address);
    console.log("   - Owner:", owner);
    console.log("   - OXS Token Address:", oxsTokenAddress);
    
    if (network === 'development') {
      console.log("\n⚠️  IMPORTANTE para desarrollo:");
      console.log("   - Actualizar oxsTokenAddress con la dirección real del token");
      console.log("   - El contrato está listo para configurar tiers");
    }
    
    console.log("\n🔄 Próximos pasos:");
    console.log("   1. Configurar la dirección real del token OXS");
    console.log("   2. Definir los parámetros de los tiers");
    console.log("   3. Integrar con el contrato de Staking");
    console.log("   4. Probar los flows de conversión");
    
  } catch (error) {
    console.error("❌ Error durante el despliegue:", error);
    throw error;
  }
}; 