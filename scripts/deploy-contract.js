const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ZubiEscrow contract...");
  
  // Get deployment parameters
  const governanceWallet = process.env.GOVERNANCE_WALLET || process.env.DEPLOYER_ADDRESS;
  
  if (!governanceWallet) {
    throw new Error("GOVERNANCE_WALLET or DEPLOYER_ADDRESS must be set in .env");
  }
  
  console.log("📋 Deployment Configuration:");
  console.log("  Network:", hre.network.name);
  console.log("  Governance Wallet:", governanceWallet);
  
  // Deploy contract
  const ZubiEscrow = await hre.ethers.getContractFactory("ZubiEscrow");
  const escrow = await ZubiEscrow.deploy(governanceWallet);
  
  await escrow.waitForDeployment();
  
  const address = await escrow.getAddress();
  
  console.log("\n✅ ZubiEscrow deployed successfully!");
  console.log("📍 Contract Address:", address);
  console.log("🔗 Network:", hre.network.name);
  console.log("⚙️  Governance Wallet:", governanceWallet);
  
  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    governanceWallet: governanceWallet,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };
  
  const deploymentPath = `./deployments/${hre.network.name}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📄 Deployment info saved to:", deploymentPath);
  
  // Verify on Etherscan (if not localhost)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations before verification...");
    await escrow.deploymentTransaction().wait(6);
    
    try {
      console.log("🔍 Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [governanceWallet],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("   You can verify manually later with:");
      console.log(`   npx hardhat verify --network ${hre.network.name} ${address} ${governanceWallet}`);
    }
  }
  
  // Test a basic function call
  console.log("\n🧪 Testing contract...");
  const govWallet = await escrow.governanceWallet();
  console.log("  Governance Wallet (read):", govWallet);
  console.log("  Match:", govWallet === governanceWallet ? "✅" : "❌");
  
  console.log("\n🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("  1. Update your .env file with:");
  console.log(`     ESCROW_CONTRACT_ADDRESS=${address}`);
  console.log("  2. Test the contract:");
  console.log(`     npx hardhat test --network ${hre.network.name}`);
  console.log("  3. Update Web3PaymentService.js with the new address");
  
  return {
    address,
    governanceWallet
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
