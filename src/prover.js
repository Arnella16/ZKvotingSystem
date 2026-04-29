const snarkjs = require("snarkjs")
const fs = require("fs")

async function generateAgeProof(secretKey, age, publicKey, ageCommitment) {
  // Inputs to the circuit
  const input = {
    // private
    secretKey: secretKey.toString(),
    age: age.toString(),
    
    // public
    publicKey: publicKey.toString(),
    ageCommitment: ageCommitment.toString(),
    minAge: "18"
  }

  // Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "build/ageVerify_js/ageVerify.wasm",
    "build/ageVerify_final.zkey"
  )

  return { proof, publicSignals }
}

module.exports = { generateAgeProof }