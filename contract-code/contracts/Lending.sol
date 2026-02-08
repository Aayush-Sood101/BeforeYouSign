// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IERC20.sol";
import "../libraries/SafeMath.sol";

/**
 * @title Digital Currency Lending Contract
 * @notice Implementation of Master Digital Currency Loan Agreement
 * @dev Implements lending mechanics per Galaxy Digital agreement terms
 * 
 * DOCUMENTATION:
 * - Loan Types: Term Deal (fixed maturity) and Open Deal (callable)
 * - Borrow Fee: As agreed in Loan Term Sheet, annualized on 360-day basis
 * - Late Fee: 3% annualized on overdue amounts
 * - Early Termination: 50% of remaining interest for Term Deals
 * - Default Events: Per Section VII and VIII of Agreement
 */
contract Lending {
    using SafeMath for uint256;

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    address public owner;
    address public lender;
    address public vaultContract;
    
    // Documented fee rates
    uint256 public constant DOCUMENTED_LATE_FEE_RATE = 300; // 3% (documented)
    uint256 public constant DOCUMENTED_EARLY_TERMINATION = 5000; // 50% (documented)
    
    // VULNERABILITY #12: Actual late fee rate (10% instead of 3%)
    uint256 private constant ACTUAL_LATE_FEE_RATE = 1000; // 10% - HIDDEN
    
    // VULNERABILITY #13: Actual early termination (100% instead of 50%)
    uint256 private constant ACTUAL_EARLY_TERMINATION = 10000; // 100% - HIDDEN
    
    // VULNERABILITY #10: Hidden origination fee (2%)
    uint256 private constant HIDDEN_ORIGINATION_FEE = 200; // 2% - UNDISCLOSED
    
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant DAYS_PER_YEAR = 360; // Per agreement
    uint256 private constant SECONDS_PER_DAY = 86400;
    
    uint256 public loanCounter;
    uint256 public totalLoansIssued;
    uint256 public totalActiveLoans;
    
    // ============================================
    // ENUMS
    // ============================================
    
    enum LoanType { TERM_DEAL, OPEN_DEAL }
    enum LoanStatus { PENDING, ACTIVE, REPAID, DEFAULTED, LIQUIDATED }
    
    // ============================================
    // STRUCTS
    // ============================================
    
    struct Loan {
        uint256 id;
        address borrower;
        address tokenAddress;
        uint256 principal;
        uint256 collateralId;
        uint256 borrowFeeRate; // Annualized rate in basis points
        uint256 startTime;
        uint256 maturityDate; // 0 for Open Deals
        LoanType loanType;
        LoanStatus status;
        uint256 totalFeesAccrued;
        uint256 totalFeesPaid;
        bool recalled; // For Open Deals
        uint256 recallTime; // When recall was issued
    }
    
    // ============================================
    // MAPPINGS
    // ============================================
    
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    
    // VULNERABILITY #15: Lender-controlled market disruption flag
    mapping(uint256 => bool) public marketDisruptionActive;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principal,
        uint256 borrowFeeRate,
        LoanType loanType
    );
    event LoanRepaid(uint256 indexed loanId, uint256 principal, uint256 fees);
    event LoanDefaulted(uint256 indexed loanId, string reason);
    event LoanLiquidated(uint256 indexed loanId, string reason);
    event LoanRecalled(uint256 indexed loanId, uint256 recallTime);
    event FeeRateChanged(uint256 indexed loanId, uint256 oldRate, uint256 newRate);
    event MarginCallTriggered(uint256 indexed loanId);
    event CrossDefaultTriggered(address indexed borrower, uint256 triggeredBy);
    event MarketDisruptionSet(uint256 indexed loanId, bool active);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Lending: caller is not the owner");
        _;
    }
    
    modifier onlyLender() {
        require(msg.sender == lender, "Lending: caller is not the lender");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner || msg.sender == lender,
            "Lending: caller is not authorized"
        );
        _;
    }
    
    modifier loanExists(uint256 loanId) {
        require(loans[loanId].id == loanId && loanId > 0, "Lending: loan does not exist");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _lender) {
        require(_lender != address(0), "Lending: lender is zero address");
        owner = msg.sender;
        lender = _lender;
    }
    
    // ============================================
    // CONFIGURATION
    // ============================================
    
    function setVaultContract(address _vaultContract) external onlyOwner {
        require(_vaultContract != address(0), "Lending: vault is zero address");
        vaultContract = _vaultContract;
    }
    
    function setLender(address _lender) external onlyOwner {
        require(_lender != address(0), "Lending: lender is zero address");
        lender = _lender;
    }
    
    // ============================================
    // LOAN CREATION (VULNERABILITY #10)
    // ============================================
    
    /**
     * @notice Create a new loan
     * @dev VULNERABILITY #10: Deducts hidden 2% origination fee
     * @param borrower Address of the borrower
     * @param tokenAddress Address of the token being borrowed
     * @param principal Amount to borrow
     * @param collateralId ID of collateral deposit in Vault
     * @param borrowFeeRate Annual borrow fee rate in basis points
     * @param maturityDate Maturity date (0 for Open Deal)
     * @param loanType Type of loan (Term or Open)
     */
    function createLoan(
        address borrower,
        address tokenAddress,
        uint256 principal,
        uint256 collateralId,
        uint256 borrowFeeRate,
        uint256 maturityDate,
        LoanType loanType
    ) external onlyLender returns (uint256) {
        require(borrower != address(0), "Lending: invalid borrower");
        require(principal > 0, "Lending: invalid principal");
        
        // VULNERABILITY #10: Calculate and deduct hidden origination fee
        uint256 hiddenFee = principal.mul(HIDDEN_ORIGINATION_FEE).div(BASIS_POINTS);
        uint256 actualDisbursement = principal.sub(hiddenFee);
        
        loanCounter++;
        uint256 loanId = loanCounter;
        
        loans[loanId] = Loan({
            id: loanId,
            borrower: borrower,
            tokenAddress: tokenAddress,
            principal: principal, // Records full principal (borrower owes full amount)
            collateralId: collateralId,
            borrowFeeRate: borrowFeeRate,
            startTime: block.timestamp,
            maturityDate: maturityDate,
            loanType: loanType,
            status: LoanStatus.ACTIVE,
            totalFeesAccrued: 0,
            totalFeesPaid: 0,
            recalled: false,
            recallTime: 0
        });
        
        borrowerLoans[borrower].push(loanId);
        totalLoansIssued++;
        totalActiveLoans++;
        
        // Transfer tokens to borrower (minus hidden fee kept by lender)
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(borrower, actualDisbursement), "Lending: transfer failed");
        
        // NOTE: Hidden fee stays with lender, no event emitted
        // Borrower receives less but owes full principal
        
        emit LoanCreated(loanId, borrower, principal, borrowFeeRate, loanType);
        
        return loanId;
    }
    
    // ============================================
    // FEE CALCULATIONS (VULNERABILITIES #11, #12, #13)
    // ============================================
    
    /**
     * @notice Calculate accrued borrow fees
     * @param loanId The loan to calculate fees for
     */
    function calculateBorrowFees(uint256 loanId) public view loanExists(loanId) returns (uint256) {
        Loan storage loan = loans[loanId];
        
        if (loan.status != LoanStatus.ACTIVE) {
            return loan.totalFeesAccrued;
        }
        
        uint256 daysElapsed = (block.timestamp - loan.startTime) / SECONDS_PER_DAY;
        uint256 dailyRate = loan.borrowFeeRate.mul(loan.principal).div(BASIS_POINTS).div(DAYS_PER_YEAR);
        
        return dailyRate.mul(daysElapsed);
    }
    
    /**
     * @notice Calculate late fees for overdue loan
     * @dev VULNERABILITY #12: Uses 10% rate instead of documented 3%
     * @param loanId The loan to calculate late fees for
     */
    function calculateLateFees(uint256 loanId) public view loanExists(loanId) returns (uint256) {
        Loan storage loan = loans[loanId];
        
        // Check if loan is overdue
        uint256 dueDate;
        if (loan.loanType == LoanType.TERM_DEAL) {
            dueDate = loan.maturityDate;
        } else if (loan.recalled) {
            dueDate = loan.recallTime + 2 days; // Recall delivery day
        } else {
            return 0; // Not overdue
        }
        
        if (block.timestamp <= dueDate) {
            return 0;
        }
        
        // VULNERABILITY #15: Lender can arbitrarily set market disruption
        if (marketDisruptionActive[loanId]) {
            return 0; // No late fees during "market disruption"
        }
        
        uint256 daysLate = (block.timestamp - dueDate) / SECONDS_PER_DAY;
        if (daysLate == 0) daysLate = 1;
        
        // VULNERABILITY #12: Uses ACTUAL_LATE_FEE_RATE (10%) instead of DOCUMENTED_LATE_FEE_RATE (3%)
        uint256 dailyLateFee = ACTUAL_LATE_FEE_RATE.mul(loan.principal).div(BASIS_POINTS).div(DAYS_PER_YEAR);
        
        return dailyLateFee.mul(daysLate);
    }
    
    /**
     * @notice Calculate early termination fee for Term Deals
     * @dev VULNERABILITY #13: Uses 100% instead of documented 50%
     * @param loanId The loan to calculate early termination fee for
     */
    function calculateEarlyTerminationFee(uint256 loanId) public view loanExists(loanId) returns (uint256) {
        Loan storage loan = loans[loanId];
        
        require(loan.loanType == LoanType.TERM_DEAL, "Lending: not a term deal");
        require(loan.status == LoanStatus.ACTIVE, "Lending: loan not active");
        require(block.timestamp < loan.maturityDate, "Lending: loan already mature");
        
        // Calculate remaining interest that would have accrued
        uint256 remainingDays = (loan.maturityDate - block.timestamp) / SECONDS_PER_DAY;
        uint256 dailyRate = loan.borrowFeeRate.mul(loan.principal).div(BASIS_POINTS).div(DAYS_PER_YEAR);
        uint256 remainingFees = dailyRate.mul(remainingDays);
        
        // VULNERABILITY #13: Uses ACTUAL_EARLY_TERMINATION (100%) instead of DOCUMENTED (50%)
        return remainingFees.mul(ACTUAL_EARLY_TERMINATION).div(BASIS_POINTS);
    }
    
    /**
     * @notice Get documented late fee rate (for transparency facade)
     * @dev Returns 3% but actual rate used is 10%
     */
    function getDocumentedLateFeeRate() external pure returns (uint256) {
        return DOCUMENTED_LATE_FEE_RATE; // Returns 300 (3%)
    }
    
    /**
     * @notice Get documented early termination rate
     * @dev Returns 50% but actual rate used is 100%
     */
    function getDocumentedEarlyTerminationRate() external pure returns (uint256) {
        return DOCUMENTED_EARLY_TERMINATION; // Returns 5000 (50%)
    }
    
    // ============================================
    // FEE RATE MANIPULATION (VULNERABILITY #11)
    // ============================================
    
    /**
     * @notice Adjust borrow fee rate for active loan
     * @dev VULNERABILITY #11: Allows mid-loan rate increases without borrower consent
     *      Agreement requires both parties to agree on rate changes
     * @param loanId The loan to modify
     * @param newRate New annual borrow fee rate in basis points
     */
    function adjustBorrowFeeRate(uint256 loanId, uint256 newRate) external onlyLender loanExists(loanId) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Lending: loan not active");
        
        // VULNERABILITY #11: No borrower consent required
        // SHOULD REQUIRE: Borrower signature or approval
        // SHOULD CHECK: New rate is reasonable (< some maximum)
        
        uint256 oldRate = loan.borrowFeeRate;
        
        // Accrue fees at old rate before changing
        loan.totalFeesAccrued = calculateBorrowFees(loanId);
        loan.borrowFeeRate = newRate;
        
        emit FeeRateChanged(loanId, oldRate, newRate);
    }
    
    /**
     * @notice Batch adjust rates for multiple loans
     * @dev Mass manipulation capability
     */
    function batchAdjustRates(uint256[] calldata loanIds, uint256 newRate) external onlyLender {
        for (uint256 i = 0; i < loanIds.length; i++) {
            if (loans[loanIds[i]].status == LoanStatus.ACTIVE) {
                uint256 oldRate = loans[loanIds[i]].borrowFeeRate;
                loans[loanIds[i]].totalFeesAccrued = calculateBorrowFees(loanIds[i]);
                loans[loanIds[i]].borrowFeeRate = newRate;
                emit FeeRateChanged(loanIds[i], oldRate, newRate);
            }
        }
    }
    
    // ============================================
    // LOAN REPAYMENT
    // ============================================
    
    /**
     * @notice Repay loan in full
     * @param loanId The loan to repay
     */
    function repayLoan(uint256 loanId) external loanExists(loanId) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Lending: loan not active");
        require(msg.sender == loan.borrower, "Lending: not borrower");
        
        uint256 borrowFees = calculateBorrowFees(loanId);
        uint256 lateFees = calculateLateFees(loanId);
        uint256 earlyTermFee = 0;
        
        // Check for early termination (Term Deals only)
        if (loan.loanType == LoanType.TERM_DEAL && block.timestamp < loan.maturityDate) {
            earlyTermFee = calculateEarlyTerminationFee(loanId);
        }
        
        uint256 totalDue = loan.principal.add(borrowFees).add(lateFees).add(earlyTermFee);
        
        IERC20 token = IERC20(loan.tokenAddress);
        require(
            token.transferFrom(msg.sender, lender, totalDue),
            "Lending: transfer failed"
        );
        
        loan.status = LoanStatus.REPAID;
        loan.totalFeesPaid = borrowFees.add(lateFees).add(earlyTermFee);
        totalActiveLoans--;
        
        emit LoanRepaid(loanId, loan.principal, loan.totalFeesPaid);
    }
    
    /**
     * @notice Repay loan partially
     * @param loanId The loan to repay
     * @param amount Amount to repay
     */
    function partialRepay(uint256 loanId, uint256 amount) external loanExists(loanId) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Lending: loan not active");
        require(msg.sender == loan.borrower, "Lending: not borrower");
        
        // Payment priority: Fees first, then principal
        uint256 outstandingFees = calculateBorrowFees(loanId).add(calculateLateFees(loanId)).sub(loan.totalFeesPaid);
        
        IERC20 token = IERC20(loan.tokenAddress);
        require(token.transferFrom(msg.sender, lender, amount), "Lending: transfer failed");
        
        if (amount >= outstandingFees) {
            loan.totalFeesPaid = loan.totalFeesPaid.add(outstandingFees);
            uint256 principalPayment = amount.sub(outstandingFees);
            loan.principal = loan.principal.sub(principalPayment);
        } else {
            loan.totalFeesPaid = loan.totalFeesPaid.add(amount);
        }
    }
    
    // ============================================
    // RECALL FUNCTIONS (OPEN DEALS)
    // ============================================
    
    /**
     * @notice Recall an open deal loan
     * @param loanId The loan to recall
     */
    function recallLoan(uint256 loanId) external onlyLender loanExists(loanId) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Lending: loan not active");
        require(loan.loanType == LoanType.OPEN_DEAL, "Lending: not open deal");
        require(!loan.recalled, "Lending: already recalled");
        
        loan.recalled = true;
        loan.recallTime = block.timestamp;
        
        emit LoanRecalled(loanId, block.timestamp);
    }
    
    // ============================================
    // LIQUIDATION (VULNERABILITY #14)
    // ============================================
    
    /**
     * @notice Liquidate a loan and seize collateral
     * @dev VULNERABILITY #14: No validation of actual default conditions
     *      Agreement Sections VII & VIII specify exact default criteria
     *      This allows liquidation with any arbitrary reason
     * @param loanId The loan to liquidate
     * @param reason Reason for liquidation (not validated)
     */
    function liquidateLoan(uint256 loanId, string memory reason) external onlyLender loanExists(loanId) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Lending: loan not active");
        
        // VULNERABILITY #14: No validation of default conditions
        // SHOULD CHECK Section VII Events of Default:
        // 1. Failure to return borrowed amount when due
        // 2. Material default of agreement terms
        // 3. Failure to provide additional collateral
        // 4. Failure to pay for Hard Fork/Airdrop distributions
        // 5. Bankruptcy/insolvency (not dismissed within 30 days)
        // 6. Material misrepresentation
        
        // SHOULD CHECK Section VIII Other Default Events:
        // 1. Loss of necessary licenses
        // 2. Criminal indictment/regulatory sanctions
        // 3. Change in law making loan illegal
        // 4. NAV decline thresholds
        // 5. Failure to deliver NAV statement
        // 6. Key person event
        
        // MALICIOUS: Accepts any reason string without validation
        
        loan.status = LoanStatus.LIQUIDATED;
        totalActiveLoans--;
        
        // Trigger collateral seizure in vault
        // IVault(vaultContract).seizeForDefault(loanId);
        
        emit LoanLiquidated(loanId, reason);
        
        // VULNERABILITY #16: Trigger cross-default cascade
        _triggerCrossDefault(loan.borrower, loanId);
    }
    
    /**
     * @notice Mark loan as defaulted for specific condition
     * @param loanId The loan to default
     * @param reason Default reason
     */
    function markDefault(uint256 loanId, string memory reason) external onlyLender loanExists(loanId) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "Lending: loan not active");
        
        loan.status = LoanStatus.DEFAULTED;
        totalActiveLoans--;
        
        emit LoanDefaulted(loanId, reason);
        
        // Trigger cross-default
        _triggerCrossDefault(loan.borrower, loanId);
    }
    
    // ============================================
    // CROSS-DEFAULT (VULNERABILITY #16)
    // ============================================
    
    /**
     * @notice Trigger cross-default for all borrower loans
     * @dev VULNERABILITY #16: Called by invalid liquidation, cascades to all loans
     *      Agreement: Cross-default only on legitimate Event of Default
     *      Here: Cascades from false liquidation to all loans
     * @param borrower The borrower whose loans are being defaulted
     * @param triggeringLoanId The loan that triggered the cascade
     */
    function _triggerCrossDefault(address borrower, uint256 triggeringLoanId) internal {
        uint256[] storage loanIds = borrowerLoans[borrower];
        
        for (uint256 i = 0; i < loanIds.length; i++) {
            uint256 loanId = loanIds[i];
            
            // Skip the triggering loan and non-active loans
            if (loanId == triggeringLoanId || loans[loanId].status != LoanStatus.ACTIVE) {
                continue;
            }
            
            // VULNERABILITY #16: Default all other loans without independent validation
            loans[loanId].status = LoanStatus.DEFAULTED;
            totalActiveLoans--;
            
            emit LoanDefaulted(loanId, "Cross-default triggered");
            // Note: Would also trigger collateral seizure for each loan
        }
        
        emit CrossDefaultTriggered(borrower, triggeringLoanId);
    }
    
    // ============================================
    // MARKET DISRUPTION (VULNERABILITY #15)
    // ============================================
    
    /**
     * @notice Set market disruption status for a loan
     * @dev VULNERABILITY #15: Lender-controlled, no objective verification
     *      Agreement defines specific Market Disruption Events (51% attacks, etc.)
     *      This allows lender to arbitrarily set/clear the flag
     * @param loanId The loan to update
     * @param active Whether market disruption is active
     */
    function setMarketDisruption(uint256 loanId, bool active) external onlyLender loanExists(loanId) {
        // VULNERABILITY #15: No validation of actual market conditions
        // SHOULD CHECK:
        // - 51% attack on blockchain
        // - Exchange transfer limits
        // - Mining/validation disruptions
        // - Censorship of transactions
        
        // MALICIOUS: Lender can set arbitrarily
        // Use case 1: Waive late fees for friends
        // Use case 2: Refuse to waive for others, charge 10% late fee
        
        marketDisruptionActive[loanId] = active;
        emit MarketDisruptionSet(loanId, active);
    }
    
    /**
     * @notice Batch set market disruption for multiple loans
     */
    function batchSetMarketDisruption(uint256[] calldata loanIds, bool active) external onlyLender {
        for (uint256 i = 0; i < loanIds.length; i++) {
            marketDisruptionActive[loanIds[i]] = active;
            emit MarketDisruptionSet(loanIds[i], active);
        }
    }
    
    // ============================================
    // EMERGENCY FUNCTIONS (VULNERABILITY #17)
    // ============================================
    
    /**
     * @notice Emergency withdrawal of all funds
     * @dev VULNERABILITY #17: Allows draining all contract funds
     *      No check if funds are needed for active loans
     * @param tokenAddress Token to withdraw
     * @param recipient Address to receive funds
     */
    function emergencyWithdrawAll(address tokenAddress, address recipient) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        
        // VULNERABILITY #17: No validation
        // SHOULD CHECK: No active loans using this token
        // SHOULD REQUIRE: Multi-sig approval
        // SHOULD HAVE: Timelock
        
        require(token.transfer(recipient, balance), "Lending: transfer failed");
    }
    
    /**
     * @notice Emergency pause all loans
     */
    function emergencyPauseAll() external onlyOwner {
        // Would pause all operations
        // In combination with emergencyWithdrawAll, allows complete drain
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function getLoan(uint256 loanId) external view returns (
        address borrower,
        address tokenAddress,
        uint256 principal,
        uint256 borrowFeeRate,
        uint256 startTime,
        uint256 maturityDate,
        LoanType loanType,
        LoanStatus status
    ) {
        Loan storage loan = loans[loanId];
        return (
            loan.borrower,
            loan.tokenAddress,
            loan.principal,
            loan.borrowFeeRate,
            loan.startTime,
            loan.maturityDate,
            loan.loanType,
            loan.status
        );
    }
    
    function getLoanDetails(uint256 loanId) external view returns (
        uint256 collateralId,
        uint256 totalFeesAccrued,
        uint256 totalFeesPaid,
        bool recalled,
        uint256 recallTime
    ) {
        Loan storage loan = loans[loanId];
        return (
            loan.collateralId,
            loan.totalFeesAccrued,
            loan.totalFeesPaid,
            loan.recalled,
            loan.recallTime
        );
    }
    
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }
    
    function getTotalOwed(uint256 loanId) external view returns (uint256) {
        Loan storage loan = loans[loanId];
        if (loan.status != LoanStatus.ACTIVE) return 0;
        
        uint256 borrowFees = calculateBorrowFees(loanId);
        uint256 lateFees = calculateLateFees(loanId);
        uint256 earlyTermFee = 0;
        
        if (loan.loanType == LoanType.TERM_DEAL && block.timestamp < loan.maturityDate) {
            earlyTermFee = calculateEarlyTerminationFee(loanId);
        }
        
        return loan.principal.add(borrowFees).add(lateFees).add(earlyTermFee).sub(loan.totalFeesPaid);
    }
    
    function isMarketDisruption(uint256 loanId) external view returns (bool) {
        return marketDisruptionActive[loanId];
    }
    
    function isLoanOverdue(uint256 loanId) external view loanExists(loanId) returns (bool) {
        Loan storage loan = loans[loanId];
        
        if (loan.status != LoanStatus.ACTIVE) return false;
        
        if (loan.loanType == LoanType.TERM_DEAL) {
            return block.timestamp > loan.maturityDate;
        } else if (loan.recalled) {
            return block.timestamp > loan.recallTime + 2 days;
        }
        
        return false;
    }
}
