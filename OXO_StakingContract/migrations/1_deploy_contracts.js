const OXSToken = artifacts.require("OXSToken");
const OXSStaking = artifacts.require("OXSStaking");
const DateTimeLib = artifacts.require("DateTimeLib");
const LogarithmLib = artifacts.require("LogarithmLib");

module.exports = async function(deployer, network, accounts) {
  const owner = accounts[0];
  
  // Primero desplegamos las bibliotecas
  await deployer.deploy(DateTimeLib);
  await deployer.deploy(LogarithmLib);
  
  // Enlazamos las bibliotecas con el contrato de staking
  await deployer.link(DateTimeLib, OXSStaking);
  await deployer.link(LogarithmLib, OXSStaking);
  
  // Desplegamos el token OXS primero
  await deployer.deploy(OXSToken, owner);
  const token = await OXSToken.deployed();
  
  // Desplegamos el contrato de staking, pasando la dirección del token
  await deployer.deploy(OXSStaking, token.address);
  const staking = await OXSStaking.deployed();
  
  // Transferimos tokens al contrato de staking (opcional, podría hacerse después)
  // Si queremos transferir tokens automáticamente durante el despliegue
  if (network === 'development') {
    // Solo para pruebas en desarrollo, transferimos una parte de los tokens
    const amount = web3.utils.toWei('10000000');  // 10M tokens
    await token.transfer(staking.address, amount, { from: owner });
    console.log(`Transferred ${web3.utils.fromWei(amount)} tokens to staking contract for testing`);
  }
}; 