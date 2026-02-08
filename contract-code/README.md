# Galaxy Digital Lending Platform

A comprehensive DeFi lending platform implementing the Master Digital Currency Loan Agreement between Argo Innovation Labs LLC and Galaxy Digital LLC.

## 🏦 Overview

This platform enables institutional-grade digital currency lending with:

- **Term Deals**: Fixed maturity loans with early termination options
- **Open Deals**: Flexible loans with callable options
- **Collateral Management**: Secure custody with margin call support
- **Multi-Asset Support**: Bitcoin, Ethereum, and other digital currencies
- **Upgradeable Architecture**: Transparent proxy pattern for future improvements

## 📋 Features

### Token Contract (DFLP)
- ERC20 compliant token
- Fixed supply of 1,000,000 tokens
- Platform fee integration (0.3%)
- Transfer restrictions for compliance

### Vault Contract
- Secure collateral custody
- Margin call management
- 24-hour grace periods (12-hour for urgent calls)
- Automatic collateral return on loan repayment

### Lending Contract
- Flexible loan terms
- Annual fee calculation (360-day basis)
- Late fee handling (3% annualized)
- Early termination support (50% of remaining interest)
- Cross-default provisions

### Proxy Contract
- Transparent upgradeable proxy (EIP-1967)
- Multi-signature admin controls
- Secure upgrade process

## 🛠 Technical Stack

- **Solidity**: ^0.8.19
- **Framework**: Hardhat
- **Testing**: Waffle + Chai
- **Dependencies**: OpenZeppelin contracts

## 📁 Project Structure

```
├── contracts/
│   ├── Token.sol        # ERC20 platform token
│   ├── Vault.sol        # Collateral management
│   ├── Lending.sol      # Core lending logic
│   └── Proxy.sol        # Upgradeable proxy
│
├── interfaces/
│   └── IERC20.sol       # ERC20 interface
│
├── libraries/
│   └── SafeMath.sol     # Safe math operations
│
├── scripts/
│   └── deploy.js        # Deployment script
│
├── test/
│   └── token.test.js    # Test suite
│
├── docs/
│   └── whitepaper.pdf   # Technical documentation
│
├── hardhat.config.js    # Hardhat configuration
├── package.json         # Dependencies
├── README.md            # This file
└── .env                 # Environment variables
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/galaxy-digital/lending-platform.git
cd lending-platform

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test

# With gas reporting
npm run test:gas

# With coverage
npm run test:coverage
```

### Deploy

```bash
# Start local node
npm run node

# Deploy to localhost (in another terminal)
npm run deploy:localhost

# Deploy to testnet
npm run deploy:sepolia

# Deploy to mainnet (use with caution)
npm run deploy:mainnet
```

## 📊 Fee Structure

| Fee Type | Rate | Calculation |
|----------|------|-------------|
| Borrow Fee | Variable | Annualized, daily accrual (360-day year) |
| Late Fee | 3% | Annualized on overdue amounts |
| Early Termination | 50% | Of remaining interest for Term Deals |
| Platform Fee | 0.3% | On token transfers |

## ⚠️ Compliance

This platform implements the legal requirements from the Master Digital Currency Loan Agreement:

- **Section III**: Fee calculations and payment priority
- **Section IV**: Collateral management and margin calls
- **Section VII & VIII**: Default event handling
- **Section XI**: Hard Fork and Airdrop handling

## 🔐 Security

- Multi-signature admin for upgrades
- Time-locked administrative functions
- Comprehensive access controls
- Regular security audits (pending)

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Contact

- **Technical Support**: dev@galaxydigital.io
- **Business Inquiries**: lending@galaxydigital.io

---

**Disclaimer**: This smart contract code is provided for educational and institutional use. Users should conduct their own due diligence and security audits before deploying to production environments.
