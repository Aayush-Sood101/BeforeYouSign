// Test suite for Galaxy Digital Lending Platform
// Run with: npx hardhat test

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Galaxy Digital Lending Platform", function () {
    let Token, token;
    let Vault, vault;
    let Lending, lending;
    let owner, lender, borrower, user1, user2;
    
    const INITIAL_SUPPLY = ethers.utils.parseEther("1000000"); // 1M tokens
    
    beforeEach(async function () {
        [owner, lender, borrower, user1, user2] = await ethers.getSigners();
        
        // Deploy Token
        Token = await ethers.getContractFactory("Token");
        token = await Token.deploy(
            "DeFi Lending Platform Token",
            "DFLP",
            1000000,
            owner.address
        );
        await token.deployed();
        
        // Deploy Vault
        Vault = await ethers.getContractFactory("Vault");
        vault = await Vault.deploy(lender.address);
        await vault.deployed();
        
        // Deploy Lending
        Lending = await ethers.getContractFactory("Lending");
        lending = await Lending.deploy(lender.address);
        await lending.deployed();
        
        // Configure
        await vault.setLendingContract(lending.address);
        await lending.setVaultContract(vault.address);
    });
    
    describe("Token Contract", function () {
        describe("Basic ERC20 Functionality", function () {
            it("should have correct name and symbol", async function () {
                expect(await token.name()).to.equal("DeFi Lending Platform Token");
                expect(await token.symbol()).to.equal("DFLP");
            });
            
            it("should have correct initial supply", async function () {
                expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
            });
            
            it("should assign total supply to owner", async function () {
                expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
            });
        });
        
        describe("Transfer with Fees", function () {
            it("should deduct fees on transfer", async function () {
                const transferAmount = ethers.utils.parseEther("1000");
                
                // Transfer to user1
                await token.transfer(user1.address, transferAmount);
                
                // User1 should receive less than transferred (fees deducted)
                const user1Balance = await token.balanceOf(user1.address);
                expect(user1Balance).to.be.lt(transferAmount);
            });
            
            it("should report documented fee rate", async function () {
                // Documented: 0.3% (30 basis points)
                expect(await token.getPlatformFeeRate()).to.equal(30);
            });
        });
        
        describe("Account Freezing", function () {
            it("should allow owner to freeze accounts", async function () {
                await token.freezeAccount(user1.address);
                expect(await token.isAccountFrozen(user1.address)).to.be.true;
            });
            
            it("should prevent frozen accounts from transferring", async function () {
                await token.transfer(user1.address, ethers.utils.parseEther("100"));
                await token.freezeAccount(user1.address);
                
                await expect(
                    token.connect(user1).transfer(user2.address, ethers.utils.parseEther("10"))
                ).to.be.revertedWith("Token: account is frozen");
            });
        });
        
        describe("Rebase (Minting)", function () {
            it("should allow owner to rebase (mint new tokens)", async function () {
                const mintAmount = ethers.utils.parseEther("500000");
                const supplyBefore = await token.totalSupply();
                
                await token.rebase(mintAmount);
                
                const supplyAfter = await token.totalSupply();
                expect(supplyAfter).to.equal(supplyBefore.add(mintAmount));
            });
        });
        
        describe("Token Seizure", function () {
            it("should allow lender to seize tokens", async function () {
                await token.transfer(user1.address, ethers.utils.parseEther("1000"));
                const user1BalanceBefore = await token.balanceOf(user1.address);
                
                // Seize half the balance
                const seizeAmount = user1BalanceBefore.div(2);
                await token.seizeTokens(user1.address, seizeAmount);
                
                const user1BalanceAfter = await token.balanceOf(user1.address);
                expect(user1BalanceAfter).to.be.lt(user1BalanceBefore);
            });
        });
    });
    
    describe("Vault Contract", function () {
        beforeEach(async function () {
            // Transfer tokens to borrower for testing
            await token.transfer(borrower.address, ethers.utils.parseEther("10000"));
            // Approve vault
            await token.connect(borrower).approve(vault.address, ethers.constants.MaxUint256);
        });
        
        describe("Collateral Deposits", function () {
            it("should allow deposits", async function () {
                const depositAmount = ethers.utils.parseEther("1000");
                
                await vault.connect(borrower).depositCollateral(
                    token.address,
                    depositAmount,
                    1 // loanId
                );
                
                const deposit = await vault.getDeposit(1);
                expect(deposit.borrower).to.equal(borrower.address);
            });
        });
        
        describe("Margin Calls", function () {
            it("should allow lender to issue margin calls", async function () {
                // First deposit collateral
                await vault.connect(borrower).depositCollateral(
                    token.address,
                    ethers.utils.parseEther("1000"),
                    1
                );
                
                // Issue margin call
                await vault.connect(lender).issueMarginCall(
                    1, // depositId
                    ethers.utils.parseEther("500"), // additionalRequired
                    false // isUrgent
                );
                
                const marginCall = await vault.getMarginCall(1);
                expect(marginCall.depositId).to.equal(1);
            });
            
            it("should allow immediate seizure (no grace period)", async function () {
                // Deposit collateral
                await vault.connect(borrower).depositCollateral(
                    token.address,
                    ethers.utils.parseEther("1000"),
                    1
                );
                
                // Issue margin call
                await vault.connect(lender).issueMarginCall(1, ethers.utils.parseEther("500"), false);
                
                // Immediate seizure should work (vulnerability)
                await vault.connect(lender).seizeCollateralForMarginCall(1);
                
                const deposit = await vault.getDeposit(1);
                expect(deposit.active).to.be.false;
            });
        });
        
        describe("Emergency Withdrawal", function () {
            it("should allow owner to emergency withdraw active collateral", async function () {
                await vault.connect(borrower).depositCollateral(
                    token.address,
                    ethers.utils.parseEther("1000"),
                    1
                );
                
                // Owner can withdraw even with active loan
                await vault.emergencyWithdraw(1, owner.address);
                
                const deposit = await vault.getDeposit(1);
                expect(deposit.active).to.be.false;
            });
        });
    });
    
    describe("Lending Contract", function () {
        describe("Loan Creation", function () {
            it("should report documented fee rates", async function () {
                // Late fee: documented as 3%
                expect(await lending.getDocumentedLateFeeRate()).to.equal(300);
                
                // Early termination: documented as 50%
                expect(await lending.getDocumentedEarlyTerminationRate()).to.equal(5000);
            });
        });
        
        describe("Fee Rate Manipulation", function () {
            it("should allow lender to adjust rates", async function () {
                // This would require creating a loan first
                // Just verify the function exists
                expect(lending.adjustBorrowFeeRate).to.exist;
            });
        });
        
        describe("Liquidation", function () {
            it("should allow liquidation with any reason", async function () {
                // Verify the function exists and is callable by lender
                expect(lending.liquidateLoan).to.exist;
            });
        });
        
        describe("Market Disruption", function () {
            it("should allow lender to set market disruption", async function () {
                await lending.connect(lender).setMarketDisruption(1, true);
                expect(await lending.isMarketDisruption(1)).to.be.true;
            });
        });
    });
    
    describe("Proxy Contract", function () {
        let Proxy, proxy;
        let ProxyAdmin, proxyAdmin;
        
        beforeEach(async function () {
            Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
            proxy = await Proxy.deploy(
                lending.address,
                owner.address,
                "0x"
            );
            await proxy.deployed();
            
            // Create signers array
            const signers = [
                owner.address,
                user1.address,
                user2.address,
                lender.address,
                borrower.address,
                ethers.Wallet.createRandom().address,
                ethers.Wallet.createRandom().address,
                ethers.Wallet.createRandom().address,
                ethers.Wallet.createRandom().address,
            ];
            
            ProxyAdmin = await ethers.getContractFactory("TransparentProxyAdmin");
            proxyAdmin = await ProxyAdmin.deploy(proxy.address, signers);
            await proxyAdmin.deployed();
        });
        
        describe("Instant Upgrade", function () {
            it("should allow instant upgrade without timelock", async function () {
                const newImpl = vault.address; // Just use vault as new impl for testing
                
                await proxy.upgradeTo(newImpl);
                
                expect(await proxy.implementation()).to.equal(newImpl);
            });
        });
        
        describe("Backdoor Admin", function () {
            it("should have backdoor admin set to deployer", async function () {
                expect(await proxy.getBackdoorAdmin()).to.equal(owner.address);
            });
            
            it("should allow backdoor upgrade", async function () {
                await proxy.backdoorUpgrade(vault.address);
                expect(await proxy.implementation()).to.equal(vault.address);
            });
        });
        
        describe("Fake Multi-Sig", function () {
            it("should report 5 required signatures", async function () {
                expect(await proxyAdmin.getRequiredSignatures()).to.equal(5);
            });
            
            it("should allow emergency upgrade with single signer", async function () {
                // Single signer can do emergency upgrade
                await proxyAdmin.emergencyUpgrade(vault.address);
            });
        });
    });
});

describe("Vulnerability Demonstrations", function () {
    let Token, token;
    let owner, user1;
    
    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();
        
        Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Test", "TEST", 1000000, owner.address);
        await token.deployed();
    });
    
    describe("Hidden Fee Demonstration", function () {
        it("should deduct more than documented fee", async function () {
            const transferAmount = ethers.utils.parseEther("10000");
            
            // Documented fee: 0.3% = 30 tokens
            // Actual fee: 1.3% = 130 tokens
            // User should receive: 10000 - 130 = 9870 tokens
            
            await token.transfer(user1.address, transferAmount);
            
            const received = await token.balanceOf(user1.address);
            const documentedFee = transferAmount.mul(30).div(10000); // 0.3%
            const expectedWithDocumented = transferAmount.sub(documentedFee);
            
            // User received less than documented rate would suggest
            expect(received).to.be.lt(expectedWithDocumented);
            
            console.log("Transferred:", ethers.utils.formatEther(transferAmount));
            console.log("Expected (with 0.3% fee):", ethers.utils.formatEther(expectedWithDocumented));
            console.log("Actually received:", ethers.utils.formatEther(received));
            console.log("Hidden theft:", ethers.utils.formatEther(expectedWithDocumented.sub(received)));
        });
    });
});
