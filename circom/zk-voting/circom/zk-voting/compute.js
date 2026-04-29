const circomlib = require("circomlibjs");

async function main() {
  const poseidon = await circomlib.buildPoseidon();

  const secretKey = 5;
  const age = 28;

  const publicKey = poseidon([secretKey]);
  const ageCommitment = poseidon([age, secretKey]);

  console.log("publicKey:", poseidon.F.toString(publicKey));
  console.log("ageCommitment:", poseidon.F.toString(ageCommitment));
}

main();