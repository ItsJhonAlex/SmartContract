// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OXSToken
 * @dev Implementación del token OXS (Osiris Token)
 * Un token ERC-20 estándar con funcionalidad de mint y burn limitada al propietario
 */
contract OXSToken is ERC20, Ownable {
    // Total supply definido en BaseModule de staking
    uint256 public constant TOTAL_SUPPLY = 62500000 * 10**18; // 62.5M tokens con 18 decimales
    
    /**
     * @dev Constructor que crea el token con un suministro inicial
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(address initialOwner) ERC20("Osiris Token", "OXS") Ownable(initialOwner) {
        // Minteamos el suministro total al owner
        _mint(initialOwner, TOTAL_SUPPLY);
    }
    
    /**
     * @dev Permite al propietario mintear tokens adicionales si es necesario
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a mintear
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Permite al propietario quemar tokens si es necesario
     * @param amount Cantidad de tokens a quemar
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Permite al propietario quemar tokens de una dirección específica
     * @param from Dirección de la que se quemarán tokens
     * @param amount Cantidad de tokens a quemar
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
} 