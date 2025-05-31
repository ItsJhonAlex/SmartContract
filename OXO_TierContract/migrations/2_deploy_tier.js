const OXSTier = artifacts.require("OXSTier");

module.exports = async function (deployer, network, accounts) {
  // En desarrollo, usamos la cuenta del desplegador como owner
  const owner = accounts[0];
  
  // Dirección del contrato OXSToken (debe ser reemplazada con la dirección real)
  const oxsTokenAddress = "0x..."; // TODO: Reemplazar con la dirección real del token
  
  console.log("🚀 Desplegando contrato OXSTier...");
  console.log("👤 Owner:", owner);
  console.log("💎 Token Address:", oxsTokenAddress);
  
  await deployer.deploy(OXSTier, oxsTokenAddress);
  const tierContract = await OXSTier.deployed();
  
  console.log("✅ Contrato OXSTier desplegado en:", tierContract.address);
}; 