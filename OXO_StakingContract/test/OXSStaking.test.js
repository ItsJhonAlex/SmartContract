const OXSToken = artifacts.require("OXSToken");
const OXSStaking = artifacts.require("OXSStaking");
const LogarithmLib = artifacts.require("LogarithmLib");
const { BN, time, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("OXSStaking", accounts => {
  const [owner, user1, user2, user3] = accounts;
  
  let token;
  let staking;
  let logarithmLib;
  
  // Valores para pruebas
  const stakedAmount1 = new BN('1000000000000000000000'); // 1000 tokens
  const stakedAmount2 = new BN('5000000000000000000000'); // 5000 tokens
  const productivity1 = new BN('50'); // 50%
  const productivity2 = new BN('75'); // 75%
  const lockDuration1 = new BN('26'); // 26 semanas
  const lockDuration2 = new BN('52'); // 52 semanas
  
  beforeEach(async () => {
    // Desplegamos las bibliotecas y los contratos
    logarithmLib = await LogarithmLib.new();
    
    // Primero desplegamos el token
    token = await OXSToken.new(owner, { from: owner });
    
    // Luego desplegamos el contrato de staking con la dirección del token
    staking = await OXSStaking.new(token.address, { from: owner });
    
    // Transferimos algunos tokens al contrato de staking para las pruebas
    const transferAmount = new BN('10000000000000000000000000'); // 10M tokens
    await token.transfer(staking.address, transferAmount, { from: owner });
  });
  
  describe("Inicialización del contrato", () => {
    it("Debe inicializar correctamente el contrato con los valores predeterminados", async () => {
      // Verificar el token
      const tokenName = await token.name();
      const tokenSymbol = await token.symbol();
      const totalSupply = await token.totalSupply();
      
      expect(tokenName).to.equal("Osiris Token");
      expect(tokenSymbol).to.equal("OXS");
      expect(totalSupply.toString()).to.equal('62500000000000000000000000'); // 62.5M tokens
      
      // Verificar que el staking tenga tokens
      const stakingBalance = await staking.getStakingBalance();
      expect(stakingBalance.toString()).to.equal('10000000000000000000000000'); // 10M tokens
      
      // Verificar que el token en el staking sea el correcto
      const tokenAddress = await token.address;
      expect(await staking.oxsToken()).to.equal(tokenAddress);
    });
  });
  
  describe("Cálculo de distribución logarítmica", () => {
    it("Debe calcular correctamente el factor de crecimiento", async () => {
      const factor1 = await logarithmLib.calculateGrowthFactor(0); // Semana 0
      const factor2 = await logarithmLib.calculateGrowthFactor(100); // Semana 100
      const factor3 = await logarithmLib.calculateGrowthFactor(727); // Semana 727 (última)
      
      // Los valores exactos dependerán de la implementación
      expect(factor1).to.be.bignumber.gt('0');
      expect(factor3).to.be.bignumber.gt(factor1); // El factor debe crecer con el tiempo
    });
    
    it("Debe calcular correctamente la distribución semanal", async () => {
      const week0Distribution = await staking.calculateWeeklyTokens(0);
      const week100Distribution = await staking.calculateWeeklyTokens(100);
      
      expect(week0Distribution).to.be.bignumber.gt('0');
      expect(week100Distribution).to.be.bignumber.gt('0');
    });
    
    it("Debe rechazar el cálculo para semanas que excedan el límite", async () => {
      await expectRevert(
        staking.calculateWeeklyTokens(728),
        "Semana excede el limite de distribucion"
      );
    });
  });
  
  describe("Gestión de usuarios y pesos", () => {
    it("Debe calcular correctamente el peso de un usuario", async () => {
      const weight1 = await staking.calculateUserWeight(stakedAmount1, productivity1, lockDuration1);
      const weight2 = await staking.calculateUserWeight(stakedAmount2, productivity2, lockDuration2);
      
      // El peso de user2 debe ser mayor porque tiene más tokens y mejores métricas
      expect(weight2).to.be.bignumber.gt(weight1);
    });
    
    it("Debe limitar la productividad a 100", async () => {
      const weightNormal = await staking.calculateUserWeight(stakedAmount1, new BN('100'), lockDuration1);
      const weightExcessive = await staking.calculateUserWeight(stakedAmount1, new BN('150'), lockDuration1);
      
      // Ambos pesos deben ser iguales porque la productividad se limita a 100
      expect(weightNormal.toString()).to.equal(weightExcessive.toString());
    });
    
    it("Debe limitar la duración de bloqueo al máximo", async () => {
      const weightNormal = await staking.calculateUserWeight(stakedAmount1, productivity1, new BN('104'));
      const weightExcessive = await staking.calculateUserWeight(stakedAmount1, productivity1, new BN('200'));
      
      // Ambos pesos deben ser iguales porque la duración se limita a MAX_STAKING_WEEKS (104)
      expect(weightNormal.toString()).to.equal(weightExcessive.toString());
    });
  });
  
  describe("Agregar reclamadores elegibles", () => {
    it("Debe agregar correctamente un usuario elegible", async () => {
      await staking.addEligibleClaimer(user1, stakedAmount1, productivity1, lockDuration1, { from: owner });
      
      const isEligible = await staking.eligibleClaimers(user1);
      const totalEligible = await staking.totalEligibleClaimers();
      const userInfo = await staking.userInfo(user1);
      
      expect(isEligible).to.be.true;
      expect(totalEligible).to.be.bignumber.equal('1');
      expect(userInfo.isEligible).to.be.true;
      expect(userInfo.userWeight).to.be.bignumber.gt('0');
    });
    
    it("Debe actualizar métricas de un usuario ya elegible", async () => {
      await staking.addEligibleClaimer(user1, stakedAmount1, productivity1, lockDuration1, { from: owner });
      const originalWeight = (await staking.userInfo(user1)).userWeight;
      
      await staking.addEligibleClaimer(user1, stakedAmount2, productivity2, lockDuration2, { from: owner });
      const newWeight = (await staking.userInfo(user1)).userWeight;
      
      expect(newWeight).to.be.bignumber.gt(originalWeight);
    });
    
    it("Debe agregar correctamente múltiples usuarios elegibles", async () => {
      await staking.addMultipleEligibleClaimers(
        [user1, user2],
        [stakedAmount1, stakedAmount2],
        [productivity1, productivity2],
        [lockDuration1, lockDuration2],
        { from: owner }
      );
      
      const isEligible1 = await staking.eligibleClaimers(user1);
      const isEligible2 = await staking.eligibleClaimers(user2);
      const totalEligible = await staking.totalEligibleClaimers();
      
      expect(isEligible1).to.be.true;
      expect(isEligible2).to.be.true;
      expect(totalEligible).to.be.bignumber.equal('2');
    });
    
    it("Debe rechazar si los arrays tienen longitudes diferentes", async () => {
      await expectRevert(
        staking.addMultipleEligibleClaimers(
          [user1, user2],
          [stakedAmount1],
          [productivity1, productivity2],
          [lockDuration1, lockDuration2],
          { from: owner }
        ),
        "Arrays de longitud no coincidente"
      );
    });
  });
  
  describe("Distribución de tokens", () => {
    beforeEach(async () => {
      // Agregamos usuarios elegibles con diferentes pesos
      await staking.addEligibleClaimer(user1, stakedAmount1, productivity1, lockDuration1, { from: owner });
      await staking.addEligibleClaimer(user2, stakedAmount2, productivity2, lockDuration2, { from: owner });
      
      // Distribuimos tokens para la semana 0
      await staking.distributeWeeklyTokens({ from: owner });
    });
    
    it("Debe distribuir correctamente los tokens para la semana actual", async () => {
      const isDistributed = await staking.weekDistributed(0);
      const weeklyAmount = await staking.weeklyDistribution(0);
      
      expect(isDistributed).to.be.true;
      expect(weeklyAmount).to.be.bignumber.gt('0');
    });
    
    it("Debe rechazar distribuir tokens para una semana ya distribuida", async () => {
      // Avanzamos el tiempo lo suficiente para evitar el error de TimeGuard (más de 15 minutos)
      await time.increase(time.duration.minutes(16));
      
      await expectRevert(
        staking.distributeWeeklyTokens({ from: owner }),
        "Tokens ya distribuidos para esta semana"
      );
    });
    
    it("Debe permitir la distribución para múltiples semanas", async () => {
      // Avanzamos el tiempo para simular que pasan semanas
      await time.increase(time.duration.weeks(3));
      
      // Distribuimos tokens para las semanas 1, 2 y 3
      await staking.distributeMultipleWeeks(1, 3, { from: owner });
      
      const isDistributed1 = await staking.weekDistributed(1);
      const isDistributed2 = await staking.weekDistributed(2);
      const isDistributed3 = await staking.weekDistributed(3);
      
      expect(isDistributed1).to.be.true;
      expect(isDistributed2).to.be.true;
      expect(isDistributed3).to.be.true;
    });
  });
  
  describe("Reclamo de tokens", () => {
    beforeEach(async () => {
      // Agregamos usuarios elegibles con diferentes pesos
      await staking.addEligibleClaimer(user1, stakedAmount1, productivity1, lockDuration1, { from: owner });
      await staking.addEligibleClaimer(user2, stakedAmount2, productivity2, lockDuration2, { from: owner });
      
      // Usuario 1 tendrá un peso menor que Usuario 2
      const weight1 = (await staking.userInfo(user1)).userWeight;
      const weight2 = (await staking.userInfo(user2)).userWeight;
      expect(weight2).to.be.bignumber.gt(weight1); 
      
      // Distribuimos tokens para la semana 0
      await staking.distributeWeeklyTokens({ from: owner });
    });
    
    it("Debe permitir a un usuario reclamar tokens proporcionalmente a su peso", async () => {
      // Obtenemos el balance inicial
      const initialBalance1 = await token.balanceOf(user1);
      const initialBalance2 = await token.balanceOf(user2);
      
      // Reclamamos tokens para ambos usuarios
      await staking.claimTokens(0, { from: user1 });
      await staking.claimTokens(0, { from: user2 });
      
      // Obtenemos los balances finales
      const finalBalance1 = await token.balanceOf(user1);
      const finalBalance2 = await token.balanceOf(user2);
      
      // Calculamos las cantidades reclamadas
      const claimed1 = finalBalance1.sub(initialBalance1);
      const claimed2 = finalBalance2.sub(initialBalance2);
      
      // El usuario 2 debe recibir más tokens por tener mayor peso
      expect(claimed2).to.be.bignumber.gt(claimed1);
      
      // Verificamos que se haya registrado el reclamo
      const hasClaimed1 = await staking.hasClaimed(user1, 0);
      const hasClaimed2 = await staking.hasClaimed(user2, 0);
      expect(hasClaimed1).to.be.true;
      expect(hasClaimed2).to.be.true;
    });
    
    it("Debe rechazar reclamar tokens dos veces para la misma semana", async () => {
      await staking.claimTokens(0, { from: user1 });
      
      await expectRevert(
        staking.claimTokens(0, { from: user1 }),
        "No hay tokens disponibles para reclamar"
      );
    });
    
    it("Debe permitir reclamar tokens de múltiples semanas", async () => {
      // Avanzamos el tiempo y distribuimos tokens para más semanas
      await time.increase(time.duration.weeks(3));
      await staking.distributeMultipleWeeks(1, 3, { from: owner });
      
      // Obtenemos el balance inicial
      const initialBalance = await token.balanceOf(user1);
      
      // Reclamamos tokens para varias semanas a la vez
      await staking.claimMultipleWeeks([0, 1, 2, 3], { from: user1 });
      
      // Obtenemos el balance final
      const finalBalance = await token.balanceOf(user1);
      
      // Verificamos que el usuario haya recibido tokens
      expect(finalBalance).to.be.bignumber.gt(initialBalance);
      
      // Verificamos que se hayan registrado los reclamos
      for (let i = 0; i <= 3; i++) {
        const hasClaimed = await staking.hasClaimed(user1, i);
        expect(hasClaimed).to.be.true;
      }
    });
  });
  
  describe("Actualización de métricas", () => {
    beforeEach(async () => {
      // Agregamos un usuario elegible
      await staking.addEligibleClaimer(user1, stakedAmount1, productivity1, lockDuration1, { from: owner });
      
      // Distribuimos tokens para la semana 0
      await staking.distributeWeeklyTokens({ from: owner });
    });
    
    it("Debe permitir al propietario actualizar las métricas de un usuario", async () => {
      const initialWeight = (await staking.userInfo(user1)).userWeight;
      
      await staking.updateUserMetrics(user1, stakedAmount2, productivity2, lockDuration2, { from: owner });
      
      const finalWeight = (await staking.userInfo(user1)).userWeight;
      expect(finalWeight).to.be.bignumber.gt(initialWeight);
    });
    
    it("Debe permitir al usuario actualizar sus propias métricas", async () => {
      const initialWeight = (await staking.userInfo(user1)).userWeight;
      
      await staking.updateUserMetrics(user1, stakedAmount2, productivity2, lockDuration2, { from: user1 });
      
      const finalWeight = (await staking.userInfo(user1)).userWeight;
      expect(finalWeight).to.be.bignumber.gt(initialWeight);
    });
    
    it("Debe rechazar actualizaciones de usuarios no autorizados", async () => {
      await expectRevert(
        staking.updateUserMetrics(user1, stakedAmount2, productivity2, lockDuration2, { from: user2 }),
        "No autorizado"
      );
    });
  });
  
  describe("Consulta de información", () => {
    beforeEach(async () => {
      // Agregamos usuarios elegibles
      await staking.addEligibleClaimer(user1, stakedAmount1, productivity1, lockDuration1, { from: owner });
      await staking.addEligibleClaimer(user2, stakedAmount2, productivity2, lockDuration2, { from: owner });
      
      // Distribuimos tokens para varias semanas
      await staking.distributeWeeklyTokens({ from: owner });
      await time.increase(time.duration.weeks(3));
      await staking.distributeMultipleWeeks(1, 3, { from: owner });
      
      // Usuario 1 reclama algunas semanas
      await staking.claimTokens(0, { from: user1 });
      await staking.claimTokens(2, { from: user1 });
    });
    
    it("Debe obtener correctamente el total de tokens pendientes", async () => {
      const pendingTokens = await staking.getPendingTokens(user1);
      
      // Deben haber tokens pendientes de las semanas 1 y 3
      expect(pendingTokens).to.be.bignumber.gt('0');
    });
    
    it("Debe obtener correctamente los detalles de un usuario", async () => {
      const userDetails = await staking.getUserDetails(user1);
      
      expect(userDetails.isEligible).to.be.true;
      expect(userDetails.totalClaimed).to.be.bignumber.gt('0');
      expect(userDetails.userWeight).to.be.bignumber.gt('0');
      expect(userDetails.stakedAmount).to.be.bignumber.equal(stakedAmount1);
      expect(userDetails.productivity).to.be.bignumber.equal(productivity1);
      expect(userDetails.lockDuration).to.be.bignumber.equal(lockDuration1);
      expect(userDetails.pendingClaims).to.be.bignumber.equal('2'); // Semanas 1 y 3
    });
    
    it("Debe obtener correctamente el historial de distribuciones", async () => {
      const history = await staking.getDistributionHistory();
      
      expect(history.length).to.equal(4); // Semanas 0, 1, 2, 3
    });
  });
  
  describe("Funciones de administración", () => {
    beforeEach(async () => {
      // Agregamos un usuario elegible
      await staking.addEligibleClaimer(user1, stakedAmount1, productivity1, lockDuration1, { from: owner });
    });
    
    it("Debe permitir al propietario eliminar un usuario elegible", async () => {
      await staking.removeEligibleClaimer(user1, { from: owner });
      
      const isEligible = await staking.eligibleClaimers(user1);
      const totalEligible = await staking.totalEligibleClaimers();
      
      expect(isEligible).to.be.false;
      expect(totalEligible).to.be.bignumber.equal('0');
    });
    
    it("Debe permitir al propietario retirar tokens en caso de emergencia", async () => {
      const amount = new BN('1000000000000000000000'); // 1000 tokens
      const balanceBefore = await token.balanceOf(user3);
      
      await staking.emergencyWithdraw(amount, user3, { from: owner });
      
      const balanceAfter = await token.balanceOf(user3);
      expect(balanceAfter.sub(balanceBefore)).to.be.bignumber.equal(amount);
    });
  });
}); 