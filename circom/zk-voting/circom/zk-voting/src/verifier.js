const snarkjs = require("snarkjs")
const fs = require("fs")

async function verifyAgeProof(proof, publicSignals) {
  const verificationKey = JSON.parse(
    fs.readFileSync("build/verification_key.json")
  )

  const valid = await snarkjs.groth16.verify(
    verificationKey,
    publicSignals,
    proof
  )

  return valid
}

module.exports = { verifyAgeProof }