const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Verifier...");

  const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Groth16Verifier.deploy();
  await verifier.waitForDeployment();

  console.log("Verifier deployed to:", verifier.target);

  console.log("Deploying Voting...");

  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(verifier.target);
  await voting.waitForDeployment();

  console.log("Voting deployed to:", voting.target);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});