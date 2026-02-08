// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IERC20.sol";
import "../libraries/SafeMath.sol";

/**
 * @title Collateral Vault
 * @notice Secure custody of collateral for Galaxy Digital lending platform
 * @dev Implements collateral management per Master Digital Currency Loan Agreement
 * 
 * DOCUMENTATION:
 * - Collateral held until loan repayment + 10 confirmations
 * - Margin calls: 24-hour (normal) or 12-hour (urgent) grace period
 * - Automatic return after repayment conditions met
 * - Collateral segregation maintained
 */
contract Vault {
    using SafeMath for uint256;

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    address public owner;
    address public lender;
    address public lendingContract;
    
    // Documented rates
    uint256 public constant MARGIN_CALL_GRACE_PERIOD = 24 hours;
    uint256 public constant URGENT_MARGIN_CALL_GRACE_PERIOD = 12 hours;
    
    // VULNERABILITY #6: Hidden maintenance fee (0.5% per month)
    uint256 private constant MAINTENANCE_FEE_RATE = 50; // 0.5% per month - UNDISCLOSED
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant SECONDS_PER_MONTH = 30 days;
    
    uint256 public totalDeposits;
    uint256 public depositCounter;
    uint256 public marginCallCounter;
    
    // ============================================
    // STRUCTS
    // ============================================
    
    struct CollateralDeposit {
        uint256 id;
        address borrower;
        address tokenAddress;
        uint256 amount;
        uint256 depositTime;
        uint256 loanId;
        bool active;
        bool approvedForReturn; // VULNERABILITY #7: Gatekeeper
    }
    
    struct MarginCall {
        uint256 id;
        uint256 depositId;
        uint256 additionalRequired;
        uint256 callTime;
        bool isUrgent;
        bool fulfilled;
        bool expired;
    }
    
    // ============================================
    // MAPPINGS
    // ============================================
    
    mapping(uint256 => CollateralDeposit) public deposits;
    mapping(uint256 => MarginCall) public marginCalls;
    mapping(address => uint256[]) public borrowerDeposits;
    mapping(uint256 => uint256) public loanToDeposit;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event CollateralDeposited(
        uint256 indexed depositId,
        address indexed borrower,
        address tokenAddress,
        uint256 amount,
        uint256 loanId
    );
    event CollateralReturned(
        uint256 indexed depositId,
        address indexed borrower,
        uint256 amount
    );
    event CollateralSeized(
        uint256 indexed depositId,
        uint256 amount,
        string reason
    );
    event MarginCallIssued(
        uint256 indexed callId,
        uint256 indexed depositId,
        uint256 additionalRequired,
        bool isUrgent
    );
    event MarginCallFulfilled(uint256 indexed callId);
    event ReturnApproved(uint256 indexed depositId);
    event ReturnDenied(uint256 indexed depositId);
    event EmergencyWithdrawal(uint256 indexed depositId, address recipient);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Vault: caller is not the owner");
        _;
    }
    
    modifier onlyLender() {
        require(msg.sender == lender, "Vault: caller is not the lender");
        _;
    }
    
    modifier onlyLendingContract() {
        require(msg.sender == lendingContract, "Vault: caller is not lending contract");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner || msg.sender == lender || msg.sender == lendingContract,
            "Vault: caller is not authorized"
        );
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _lender) {
        require(_lender != address(0), "Vault: lender is zero address");
        owner = msg.sender;
        lender = _lender;
    }
    
    // ============================================
    // CONFIGURATION
    // ============================================
    
    function setLendingContract(address _lendingContract) external onlyOwner {
        require(_lendingContract != address(0), "Vault: lending contract is zero address");
        lendingContract = _lendingContract;
    }
    
    function setLender(address _lender) external onlyOwner {
        require(_lender != address(0), "Vault: lender is zero address");
        lender = _lender;
    }
    
    // ============================================
    // DEPOSIT FUNCTIONS
    // ============================================
    
    /**
     * @notice Deposit collateral for a loan
     * @param tokenAddress Address of the collateral token
     * @param amount Amount of collateral to deposit
     * @param loanId Associated loan ID
     */
    function depositCollateral(
        address tokenAddress,
        uint256 amount,
        uint256 loanId
    ) external returns (uint256) {
        require(tokenAddress != address(0), "Vault: invalid token address");
        require(amount > 0, "Vault: amount must be greater than zero");
        
        IERC20 token = IERC20(tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Vault: transfer failed"
        );
        
        depositCounter++;
        uint256 depositId = depositCounter;
        
        deposits[depositId] = CollateralDeposit({
            id: depositId,
            borrower: msg.sender,
            tokenAddress: tokenAddress,
            amount: amount,
            depositTime: block.timestamp,
            loanId: loanId,
            active: true,
            approvedForReturn: false
        });
        
        borrowerDeposits[msg.sender].push(depositId);
        loanToDeposit[loanId] = depositId;
        totalDeposits = totalDeposits.add(amount);
        
        emit CollateralDeposited(depositId, msg.sender, tokenAddress, amount, loanId);
        
        return depositId;
    }
    
    /**
     * @notice Add additional collateral to existing deposit
     */
    function addCollateral(uint256 depositId, uint256 amount) external {
        CollateralDeposit storage deposit = deposits[depositId];
        require(deposit.active, "Vault: deposit not active");
        require(msg.sender == deposit.borrower, "Vault: not deposit owner");
        
        IERC20 token = IERC20(deposit.tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Vault: transfer failed"
        );
        
        deposit.amount = deposit.amount.add(amount);
        totalDeposits = totalDeposits.add(amount);
    }
    
    // ============================================
    // MARGIN CALL FUNCTIONS
    // ============================================
    
    /**
     * @notice Issue a margin call for a deposit
     * @param depositId The deposit requiring additional collateral
     * @param additionalRequired Amount of additional collateral needed
     * @param isUrgent Whether this is an urgent margin call (12hr vs 24hr)
     */
    function issueMarginCall(
        uint256 depositId,
        uint256 additionalRequired,
        bool isUrgent
    ) external onlyLender returns (uint256) {
        CollateralDeposit storage deposit = deposits[depositId];
        require(deposit.active, "Vault: deposit not active");
        
        marginCallCounter++;
        uint256 callId = marginCallCounter;
        
        marginCalls[callId] = MarginCall({
            id: callId,
            depositId: depositId,
            additionalRequired: additionalRequired,
            callTime: block.timestamp,
            isUrgent: isUrgent,
            fulfilled: false,
            expired: false
        });
        
        emit MarginCallIssued(callId, depositId, additionalRequired, isUrgent);
        
        return callId;
    }
    
    /**
     * @notice Fulfill a margin call by depositing additional collateral
     */
    function fulfillMarginCall(uint256 callId, uint256 amount) external {
        MarginCall storage call = marginCalls[callId];
        require(!call.fulfilled, "Vault: margin call already fulfilled");
        require(!call.expired, "Vault: margin call expired");
        
        CollateralDeposit storage deposit = deposits[call.depositId];
        require(msg.sender == deposit.borrower, "Vault: not deposit owner");
        require(amount >= call.additionalRequired, "Vault: insufficient amount");
        
        IERC20 token = IERC20(deposit.tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Vault: transfer failed"
        );
        
        deposit.amount = deposit.amount.add(amount);
        totalDeposits = totalDeposits.add(amount);
        call.fulfilled = true;
        
        emit MarginCallFulfilled(callId);
    }
    
    /**
     * @notice Seize collateral for unfulfilled margin call
     * @dev VULNERABILITY #5: No grace period check - allows immediate seizure
     *      Agreement requires 24hr (normal) or 12hr (urgent) grace period
     */
    function seizeCollateralForMarginCall(uint256 callId) external onlyLender {
        MarginCall storage call = marginCalls[callId];
        require(!call.fulfilled, "Vault: margin call already fulfilled");
        
        // VULNERABILITY #5: Missing grace period validation
        // SHOULD CHECK:
        // uint256 gracePeriod = call.isUrgent ? URGENT_MARGIN_CALL_GRACE_PERIOD : MARGIN_CALL_GRACE_PERIOD;
        // require(block.timestamp >= call.callTime + gracePeriod, "Vault: grace period not expired");
        
        // MALICIOUS: Allows immediate seizure without waiting for grace period
        
        CollateralDeposit storage deposit = deposits[call.depositId];
        require(deposit.active, "Vault: deposit already seized");
        
        uint256 seizedAmount = deposit.amount;
        deposit.active = false;
        deposit.amount = 0;
        call.expired = true;
        
        totalDeposits = totalDeposits.sub(seizedAmount);
        
        IERC20 token = IERC20(deposit.tokenAddress);
        require(token.transfer(lender, seizedAmount), "Vault: transfer failed");
        
        emit CollateralSeized(call.depositId, seizedAmount, "Margin call not fulfilled");
    }
    
    // ============================================
    // WITHDRAWAL FUNCTIONS (VULNERABILITY #7)
    // ============================================
    
    /**
     * @notice Request return of collateral after loan repayment
     * @dev VULNERABILITY #7: Creates gatekeeper - requires lender approval
     *      Agreement: Automatic return after repayment + 10 confirmations
     */
    function requestCollateralReturn(uint256 depositId) external {
        CollateralDeposit storage deposit = deposits[depositId];
        require(deposit.active, "Vault: deposit not active");
        require(msg.sender == deposit.borrower, "Vault: not deposit owner");
        
        // VULNERABILITY #7: Emits misleading event - return not guaranteed
        emit CollateralReturned(depositId, msg.sender, 0);
        // NOTE: Actual return requires approveCollateralReturn() from lender
    }
    
    /**
     * @notice Lender approves or denies collateral return
     * @dev VULNERABILITY #7: Gatekeeper function - lender can indefinitely deny
     */
    function approveCollateralReturn(uint256 depositId, bool approved) external onlyLender {
        CollateralDeposit storage deposit = deposits[depositId];
        require(deposit.active, "Vault: deposit not active");
        
        deposit.approvedForReturn = approved;
        
        if (approved) {
            emit ReturnApproved(depositId);
        } else {
            emit ReturnDenied(depositId);
        }
    }
    
    /**
     * @notice Withdraw collateral after approval
     * @dev VULNERABILITY #6 & #7: 
     *      - Requires lender approval (gatekeeper)
     *      - Deducts hidden maintenance fee
     */
    function withdrawCollateral(uint256 depositId) external {
        CollateralDeposit storage deposit = deposits[depositId];
        require(deposit.active, "Vault: deposit not active");
        require(msg.sender == deposit.borrower, "Vault: not deposit owner");
        
        // VULNERABILITY #7: Requires lender approval
        require(deposit.approvedForReturn, "Vault: not approved for return");
        
        // VULNERABILITY #6: Calculate hidden maintenance fee
        uint256 monthsHeld = (block.timestamp - deposit.depositTime) / SECONDS_PER_MONTH;
        if (monthsHeld == 0) monthsHeld = 1; // Minimum 1 month charge
        
        uint256 maintenanceFee = deposit.amount.mul(MAINTENANCE_FEE_RATE).mul(monthsHeld).div(BASIS_POINTS);
        uint256 returnAmount = deposit.amount.sub(maintenanceFee);
        
        deposit.active = false;
        uint256 originalAmount = deposit.amount;
        deposit.amount = 0;
        
        totalDeposits = totalDeposits.sub(originalAmount);
        
        IERC20 token = IERC20(deposit.tokenAddress);
        
        // Return reduced amount to borrower
        require(token.transfer(msg.sender, returnAmount), "Vault: transfer failed");
        
        // VULNERABILITY #6: Send hidden fee to owner (NO EVENT)
        if (maintenanceFee > 0) {
            require(token.transfer(owner, maintenanceFee), "Vault: fee transfer failed");
        }
        
        emit CollateralReturned(depositId, msg.sender, returnAmount);
        // NOTE: Event shows reduced amount, fee collection is invisible
    }
    
    // ============================================
    // EMERGENCY FUNCTIONS (VULNERABILITY #8)
    // ============================================
    
    /**
     * @notice Emergency withdrawal of collateral
     * @dev VULNERABILITY #8: No check if loan is still active
     *      Allows owner to steal collateral during active loans
     * @param depositId The deposit to withdraw
     * @param recipient Address to receive the collateral
     */
    function emergencyWithdraw(uint256 depositId, address recipient) external onlyOwner {
        CollateralDeposit storage deposit = deposits[depositId];
        require(deposit.amount > 0, "Vault: no collateral");
        
        // VULNERABILITY #8: No check if loan is repaid
        // SHOULD CHECK: Loan status from lending contract
        // SHOULD REQUIRE: Loan to be fully repaid before allowing withdrawal
        
        // MALICIOUS: Allows stealing collateral during active loans
        
        uint256 amount = deposit.amount;
        deposit.amount = 0;
        deposit.active = false;
        
        totalDeposits = totalDeposits.sub(amount);
        
        IERC20 token = IERC20(deposit.tokenAddress);
        require(token.transfer(recipient, amount), "Vault: transfer failed");
        
        emit EmergencyWithdrawal(depositId, recipient);
        emit CollateralSeized(depositId, amount, "Emergency withdrawal");
    }
    
    /**
     * @notice Emergency withdrawal of all collateral for a token
     * @dev VULNERABILITY #8: Mass theft capability
     */
    function emergencyWithdrawAll(address tokenAddress, address recipient) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        
        require(token.transfer(recipient, balance), "Vault: transfer failed");
        
        // NOTE: Does not update deposit records - breaks contract state
    }
    
    // ============================================
    // SEIZURE FUNCTIONS (VULNERABILITY #9)
    // ============================================
    
    /**
     * @notice Seize collateral for any reason
     * @dev VULNERABILITY #9: No validation of default conditions
     *      Agreement Section VII & VIII specify exact default conditions
     *      This allows seizure with any arbitrary reason string
     * @param depositId The deposit to seize
     * @param reason Reason for seizure (not validated)
     */
    function seizeCollateral(uint256 depositId, string memory reason) external onlyLender {
        CollateralDeposit storage deposit = deposits[depositId];
        require(deposit.active, "Vault: deposit already seized");
        
        // VULNERABILITY #9: No validation against legal default conditions
        // SHOULD CHECK any of:
        // - Failure to repay borrowed amount
        // - Failure to meet margin call within grace period
        // - Bankruptcy/insolvency (with 30-day cure period)
        // - Material breach of agreement
        // - NAV decline thresholds (25% MoM, 50% over 3mo, 50% YoY)
        // - Key person event
        // - Criminal indictment or regulatory sanctions
        
        // MALICIOUS: Accepts any reason string without validation
        
        uint256 amount = deposit.amount;
        deposit.active = false;
        deposit.amount = 0;
        
        totalDeposits = totalDeposits.sub(amount);
        
        IERC20 token = IERC20(deposit.tokenAddress);
        require(token.transfer(lender, amount), "Vault: transfer failed");
        
        emit CollateralSeized(depositId, amount, reason);
    }
    
    /**
     * @notice Seize collateral due to loan default
     * @dev Called by lending contract on default
     */
    function seizeForDefault(uint256 loanId) external onlyLendingContract {
        uint256 depositId = loanToDeposit[loanId];
        CollateralDeposit storage deposit = deposits[depositId];
        
        if (!deposit.active) return;
        
        uint256 amount = deposit.amount;
        deposit.active = false;
        deposit.amount = 0;
        
        totalDeposits = totalDeposits.sub(amount);
        
        IERC20 token = IERC20(deposit.tokenAddress);
        require(token.transfer(lender, amount), "Vault: transfer failed");
        
        emit CollateralSeized(depositId, amount, "Loan default");
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function getDeposit(uint256 depositId) external view returns (
        address borrower,
        address tokenAddress,
        uint256 amount,
        uint256 depositTime,
        uint256 loanId,
        bool active,
        bool approvedForReturn
    ) {
        CollateralDeposit storage deposit = deposits[depositId];
        return (
            deposit.borrower,
            deposit.tokenAddress,
            deposit.amount,
            deposit.depositTime,
            deposit.loanId,
            deposit.active,
            deposit.approvedForReturn
        );
    }
    
    function getMarginCall(uint256 callId) external view returns (
        uint256 depositId,
        uint256 additionalRequired,
        uint256 callTime,
        bool isUrgent,
        bool fulfilled,
        bool expired
    ) {
        MarginCall storage call = marginCalls[callId];
        return (
            call.depositId,
            call.additionalRequired,
            call.callTime,
            call.isUrgent,
            call.fulfilled,
            call.expired
        );
    }
    
    function getBorrowerDeposits(address borrower) external view returns (uint256[] memory) {
        return borrowerDeposits[borrower];
    }
    
    function getDepositForLoan(uint256 loanId) external view returns (uint256) {
        return loanToDeposit[loanId];
    }
    
    /**
     * @notice Get documented grace periods
     * @dev Returns correct values, but seizure function doesn't enforce them
     */
    function getGracePeriods() external pure returns (uint256 normal, uint256 urgent) {
        return (MARGIN_CALL_GRACE_PERIOD, URGENT_MARGIN_CALL_GRACE_PERIOD);
    }
    
    /**
     * @notice Check if margin call grace period has expired
     */
    function isMarginCallExpired(uint256 callId) external view returns (bool) {
        MarginCall storage call = marginCalls[callId];
        uint256 gracePeriod = call.isUrgent ? URGENT_MARGIN_CALL_GRACE_PERIOD : MARGIN_CALL_GRACE_PERIOD;
        return block.timestamp >= call.callTime + gracePeriod;
    }
}
