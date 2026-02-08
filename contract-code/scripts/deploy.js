// Deployment script for Galaxy Digital Lending Platform
// Run with: npx hardhat run scripts/deploy.js --network <network>

const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("Deploying Galaxy Digital Lending Platform...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());
    console.log("");
    
    // ============================================
    // 1. Deploy Token Contract
    // ============================================
    console.log("1. Deploying Token (DFLP)...");
    
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(
        "DeFi Lending Platform Token",  // name
        "DFLP",                          // symbol
        1000000,                         // initialSupply (1M tokens)
        deployer.address                 // feeCollector
    );
    await token.deployed();
    
    console.log("   Token deployed to:", token.address);
    console.log("   Total Supply:", await token.totalSupply());
    console.log("");
    
    // ============================================
    // 2. Deploy Vault Contract
    // ============================================
    console.log("2. Deploying Vault...");
    
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(deployer.address); // lender = deployer
    await vault.deployed();
    
    console.log("   Vault deployed to:", vault.address);
    console.log("");
    
    // ============================================
    // 3. Deploy Lending Contract
    // ============================================
    console.log("3. Deploying Lending...");
    
    const Lending = await ethers.getContractFactory("Lending");
    const lending = await Lending.deploy(deployer.address); // lender = deployer
    await lending.deployed();
    
    console.log("   Lending deployed to:", lending.address);
    console.log("");
    
    // ============================================
    // 4. Deploy Proxy Contract
    // ============================================
    console.log("4. Deploying TransparentUpgradeableProxy...");
    
    // First deploy a simple implementation for the proxy
    const ProxyTarget = await ethers.getContractFactory("Lending");
    const proxyTarget = await ProxyTarget.deploy(deployer.address);
    await proxyTarget.deployed();
    
    const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
    const proxy = await Proxy.deploy(
        proxyTarget.address,    // implementation
        deployer.address,       // admin
        "0x"                    // no initialization data
    );
    await proxy.deployed();
    
    console.log("   Proxy deployed to:", proxy.address);
    console.log("   Implementation:", proxyTarget.address);
    console.log("");
    
    // ============================================
    // 5. Deploy ProxyAdmin (Multi-sig facade)
    // ============================================
    console.log("5. Deploying TransparentProxyAdmin...");
    
    // Create 9 signer addresses (as claimed in docs)
    const signers = [
        deployer.address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
        ethers.Wallet.createRandom().address,
    ];
    
    const ProxyAdmin = await ethers.getContractFactory("TransparentProxyAdmin");
    const proxyAdmin = await ProxyAdmin.deploy(proxy.address, signers);
    await proxyAdmin.deployed();
    
    console.log("   ProxyAdmin deployed to:", proxyAdmin.address);
    console.log("   Claimed required signatures:", await proxyAdmin.getRequiredSignatures());
    console.log("   Actual signers:", signers.length);
    console.log("");
    
    // ============================================
    // 6. Configure Contracts
    // ============================================
    console.log("6. Configuring contracts...");
    
    // Set vault in lending contract
    await lending.setVaultContract(vault.address);
    console.log("   Vault configured in Lending");
    
    // Set lending contract in vault
    await vault.setLendingContract(lending.address);
    console.log("   Lending configured in Vault");
    
    console.log("");
    
    // ============================================
    // Summary
    // ============================================
    console.log("=".repeat(50));
    console.log("DEPLOYMENT COMPLETE");
    console.log("=".repeat(50));
    console.log("");
    console.log("Contract Addresses:");
    console.log("-------------------");
    console.log("Token (DFLP):      ", token.address);
    console.log("Vault:             ", vault.address);
    console.log("Lending:           ", lending.address);
    console.log("Proxy:             ", proxy.address);
    console.log("ProxyAdmin:        ", proxyAdmin.address);
    console.log("");
    console.log("Owner/Deployer:    ", deployer.address);
    console.log("");
    console.log("=".repeat(50));
    console.log("SECURITY NOTES (for testing only):");
    console.log("=".repeat(50));
    console.log("- Hidden fee collector: deployer address");
    console.log("- Backdoor admin: deployer address");
    console.log("- Multi-sig requires: 1 signature (not 5)");
    console.log("");
    
    // Save deployment addresses to file
    const fs = require("fs");
    const deploymentInfo = {
        network: network.name,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            Token: token.address,
            Vault: vault.address,
            Lending: lending.address,
            Proxy: proxy.address,
            ProxyAdmin: proxyAdmin.address,
        }
    };
    
    fs.writeFileSync(
        "deployment.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("Deployment info saved to deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
