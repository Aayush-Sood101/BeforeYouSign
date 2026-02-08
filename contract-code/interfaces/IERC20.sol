// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IERC20
 * @notice Interface for ERC20 standard token
 * @dev https://eips.ethereum.org/EIPS/eip-20
 */
interface IERC20 {
    /**
     * @notice Returns the name of the token
     */
    function name() external view returns (string memory);
    
    /**
     * @notice Returns the symbol of the token
     */
    function symbol() external view returns (string memory);
    
    /**
     * @notice Returns the decimals of the token
     */
    function decimals() external view returns (uint8);
    
    /**
     * @notice Returns the total supply of the token
     */
    function totalSupply() external view returns (uint256);
    
    /**
     * @notice Returns the balance of an account
     * @param account The address to query
     */
    function balanceOf(address account) external view returns (uint256);
    
    /**
     * @notice Returns the allowance of a spender for an owner
     * @param owner The owner address
     * @param spender The spender address
     */
    function allowance(address owner, address spender) external view returns (uint256);
    
    /**
     * @notice Transfers tokens to a recipient
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function transfer(address to, uint256 amount) external returns (bool);
    
    /**
     * @notice Approves a spender to spend tokens
     * @param spender The spender address
     * @param amount The amount to approve
     */
    function approve(address spender, uint256 amount) external returns (bool);
    
    /**
     * @notice Transfers tokens from an owner to a recipient
     * @param from The owner address
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    /**
     * @notice Emitted when tokens are transferred
     */
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    /**
     * @notice Emitted when an approval is made
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
