// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SafeMath
 * @notice Math operations with safety checks that revert on error
 * @dev Library for safe mathematical operations
 * 
 * Note: In Solidity 0.8+, overflow/underflow checks are built-in.
 * This library is provided for explicit operation naming and compatibility.
 */
library SafeMath {
    
    /**
     * @notice Adds two numbers, reverts on overflow
     * @param a First number
     * @param b Second number
     * @return Sum of a and b
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }
    
    /**
     * @notice Subtracts two numbers, reverts on underflow
     * @param a First number
     * @param b Second number
     * @return Difference of a and b
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction underflow");
        return a - b;
    }
    
    /**
     * @notice Subtracts two numbers with custom error message
     * @param a First number
     * @param b Second number
     * @param errorMessage Custom error message
     * @return Difference of a and b
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        return a - b;
    }
    
    /**
     * @notice Multiplies two numbers, reverts on overflow
     * @param a First number
     * @param b Second number
     * @return Product of a and b
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }
    
    /**
     * @notice Divides two numbers, reverts on division by zero
     * @param a Dividend
     * @param b Divisor
     * @return Quotient of a divided by b
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        return a / b;
    }
    
    /**
     * @notice Divides two numbers with custom error message
     * @param a Dividend
     * @param b Divisor
     * @param errorMessage Custom error message
     * @return Quotient of a divided by b
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        return a / b;
    }
    
    /**
     * @notice Returns the remainder of division
     * @param a Dividend
     * @param b Divisor
     * @return Remainder of a divided by b
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: modulo by zero");
        return a % b;
    }
    
    /**
     * @notice Returns the smaller of two numbers
     * @param a First number
     * @param b Second number
     * @return Smaller of a and b
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
    
    /**
     * @notice Returns the larger of two numbers
     * @param a First number
     * @param b Second number
     * @return Larger of a and b
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }
    
    /**
     * @notice Returns the average of two numbers (rounded down)
     * @param a First number
     * @param b Second number
     * @return Average of a and b
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a & b) + (a ^ b) / 2;
    }
    
    /**
     * @notice Calculates percentage of a number
     * @param amount Base amount
     * @param basisPoints Percentage in basis points (100 = 1%)
     * @return Calculated percentage
     */
    function percentage(uint256 amount, uint256 basisPoints) internal pure returns (uint256) {
        return mul(amount, basisPoints) / 10000;
    }
}
