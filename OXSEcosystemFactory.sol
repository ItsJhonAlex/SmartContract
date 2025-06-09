// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title OXSEcosystemFactory
 * @dev Factory contract que despliega y coordina todo el ecosistema DeFi de OXS
 * Maneja Staking + Tier System + Yield Farming de manera integrada
 */
contract OXSEcosystemFactory is Ownable, Pausable {
    
    // Addresses de los contratos del ecosistema
    address public oxsToken;
    address public stakingContract;
    address public tierContract;  
    address public yieldFarmingContract;
    
    // Versión del ecosistema para upgrades
    uint256 public constant ECOSYSTEM_VERSION = 1;
    
    // Estado del deployment
    bool public isFullyDeployed;
    bool public isInitialized;
    
    // Eventos del ecosistema
    event EcosystemDeployed(
        address indexed oxsToken,
        address indexed stakingContract,
        address indexed tierContract,
        address yieldFarmingContract,
        uint256 timestamp
    );
    
    event EcosystemInitialized(
        address indexed initializer,
        uint256 timestamp
    );
    
    event ContractUpgraded(
        string indexed contractType,
        address indexed oldAddress,
        address indexed newAddress,
        uint256 timestamp
    );
    
    /**
     * @dev Constructor del Factory
     * @param initialOwner Owner inicial del ecosistema
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Owner no puede ser address zero");
    }
    
    /**
     * @dev Registra las direcciones de los contratos ya desplegados
     * @param _oxsToken Dirección del token OXS
     * @param _stakingContract Dirección del contrato de staking
     * @param _tierContract Dirección del contrato de tiers
     * @param _yieldFarmingContract Dirección del contrato de yield farming
     */
    function registerContracts(
        address _oxsToken,
        address _stakingContract,
        address _tierContract,
        address _yieldFarmingContract
    ) external onlyOwner {
        require(!isFullyDeployed, "Contratos ya registrados");
        require(_oxsToken != address(0), "OXS Token address invalid");
        require(_stakingContract != address(0), "Staking Contract address invalid");
        require(_tierContract != address(0), "Tier Contract address invalid");
        require(_yieldFarmingContract != address(0), "Yield Farming Contract address invalid");
        
        oxsToken = _oxsToken;
        stakingContract = _stakingContract;
        tierContract = _tierContract;
        yieldFarmingContract = _yieldFarmingContract;
        
        isFullyDeployed = true;
        
        emit EcosystemDeployed(
            _oxsToken,
            _stakingContract,
            _tierContract,
            _yieldFarmingContract,
            block.timestamp
        );
    }
    
    /**
     * @dev Inicializa todas las referencias cruzadas entre contratos
     */
    function initializeEcosystem() external onlyOwner {
        require(isFullyDeployed, "Contratos no registrados aun");
        require(!isInitialized, "Ecosistema ya inicializado");
        
        // Inicializar Yield Farming con referencias a Staking y Tier
        _initializeYieldFarming();
        
        // Inicializar Staking con referencia a Tier (si tiene esa funcionalidad)
        _initializeStaking();
        
        // Inicializar Tier con referencia a Staking (si tiene esa funcionalidad)  
        _initializeTier();
        
        isInitialized = true;
        
        emit EcosystemInitialized(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Inicializa el contrato de Yield Farming
     */
    function _initializeYieldFarming() private {
        // Llamar a initializeContracts del Yield Farming
        (bool success,) = yieldFarmingContract.call(
            abi.encodeWithSignature(
                "initializeContracts(address,address,address)",
                oxsToken,
                stakingContract,
                tierContract
            )
        );
        require(success, "Error inicializando Yield Farming");
    }
    
    /**
     * @dev Inicializa el contrato de Staking
     */
    function _initializeStaking() private {
        // Si el contrato de staking tiene función de inicialización, llamarla aquí
        // Por ahora solo verificamos que esté activo
        require(stakingContract.code.length > 0, "Staking contract no desplegado");
    }
    
    /**
     * @dev Inicializa el contrato de Tier
     */
    function _initializeTier() private {
        // Si el contrato de tier tiene función de inicialización, llamarla aquí
        // Por ahora solo verificamos que esté activo
        require(tierContract.code.length > 0, "Tier contract no desplegado");
    }
    
    /**
     * @dev Verifica el estado de salud del ecosistema
     * @return stakingHealth Estado del contrato de staking
     * @return tierHealth Estado del contrato de tier
     * @return yieldFarmingHealth Estado del contrato de yield farming
     * @return overallHealth Estado general del ecosistema
     */
    function checkEcosystemHealth() external view returns (
        bool stakingHealth,
        bool tierHealth,  
        bool yieldFarmingHealth,
        bool overallHealth
    ) {
        stakingHealth = stakingContract != address(0) && stakingContract.code.length > 0;
        tierHealth = tierContract != address(0) && tierContract.code.length > 0;
        yieldFarmingHealth = yieldFarmingContract != address(0) && yieldFarmingContract.code.length > 0;
        
        overallHealth = stakingHealth && tierHealth && yieldFarmingHealth && isInitialized;
    }
    
    /**
     * @dev Obtiene todas las direcciones del ecosistema
     */
    function getEcosystemAddresses() external view returns (
        address _oxsToken,
        address _stakingContract,
        address _tierContract,
        address _yieldFarmingContract
    ) {
        return (oxsToken, stakingContract, tierContract, yieldFarmingContract);
    }
    
    /**
     * @dev Actualiza la dirección de un contrato (para upgrades)
     * @param contractType Tipo de contrato ("STAKING", "TIER", "YIELD_FARMING")
     * @param newAddress Nueva dirección del contrato
     */
    function upgradeContract(
        string calldata contractType,
        address newAddress
    ) external onlyOwner {
        require(newAddress != address(0), "Nueva direccion invalida");
        require(newAddress.code.length > 0, "Direccion no es un contrato");
        
        address oldAddress;
        
        if (keccak256(bytes(contractType)) == keccak256(bytes("STAKING"))) {
            oldAddress = stakingContract;
            stakingContract = newAddress;
        } else if (keccak256(bytes(contractType)) == keccak256(bytes("TIER"))) {
            oldAddress = tierContract;
            tierContract = newAddress;
        } else if (keccak256(bytes(contractType)) == keccak256(bytes("YIELD_FARMING"))) {
            oldAddress = yieldFarmingContract;
            yieldFarmingContract = newAddress;
        } else {
            revert("Tipo de contrato invalido");
        }
        
        emit ContractUpgraded(contractType, oldAddress, newAddress, block.timestamp);
        
        // Re-inicializar si es necesario
        if (isInitialized) {
            isInitialized = false;
        }
    }
    
    /**
     * @dev Pausa todo el ecosistema en caso de emergencia
     */
    function pauseEcosystem() external onlyOwner {
        _pause();
        
        // Pausar cada contrato individualmente si tienen esa funcionalidad
        _pauseContract(stakingContract);
        _pauseContract(tierContract);
        _pauseContract(yieldFarmingContract);
    }
    
    /**
     * @dev Despausa todo el ecosistema
     */
    function unpauseEcosystem() external onlyOwner {
        _unpause();
        
        // Despausar cada contrato individualmente
        _unpauseContract(stakingContract);
        _unpauseContract(tierContract);
        _unpauseContract(yieldFarmingContract);
    }
    
    /**
     * @dev Pausa un contrato específico
     */
    function _pauseContract(address contractAddress) private {
        (bool success,) = contractAddress.call(
            abi.encodeWithSignature("pauseProtocol()")
        );
        // No revert si falla - algunos contratos pueden no tener esta función
    }
    
    /**
     * @dev Despausa un contrato específico
     */
    function _unpauseContract(address contractAddress) private {
        (bool success,) = contractAddress.call(
            abi.encodeWithSignature("unpauseProtocol()")
        );
        // No revert si falla - algunos contratos pueden no tener esta función
    }
    
    /**
     * @dev Función de emergencia para recuperar tokens enviados por error
     */
    function emergencyRecoverTokens(
        address tokenAddress,
        uint256 amount,
        address to
    ) external onlyOwner {
        require(to != address(0), "Direccion de destino invalida");
        IERC20(tokenAddress).transfer(to, amount);
    }
} 