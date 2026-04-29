const dilithium = require("dilithium-crystals")
const { buildPoseidon } = require("circomlibjs")
const fs = require("fs")
const crypto = require("crypto")

async function register() {
    // Generate unique secretKey for this voter
    const secretKey = BigInt("0x" + crypto.randomBytes(4).toString("hex")) % BigInt(2**31)
    const age = BigInt(process.argv[2] || "20") // pass age as argument

    console.log("Registering voter...")
    console.log("Secret key:", secretKey.toString())
    console.log("Age:", age.toString())

    // Generate Dilithium keypair
    const { publicKey, privateKey } = await dilithium.keyPair()

    // Compute hashes
    const poseidon = await buildPoseidon()
    const F = poseidon.F

    const pubKeyChunks = Array.from(publicKey).slice(0, 16).map(x => BigInt(x))

    const publicKeyHash = F.toString(poseidon([secretKey]))
    const ageCommitment = F.toString(poseidon([age, secretKey]))
    const dilithiumKeyHash = F.toString(poseidon(pubKeyChunks))

    // Save everything
    fs.writeFileSync("voter_keys.json", JSON.stringify({
        secretKey: secretKey.toString(),
        age: age.toString(),
        publicKey: Array.from(publicKey),
        privateKey: Array.from(privateKey),
        publicKeyHash,
        ageCommitment,
        dilithiumKeyHash
    }, null, 2))

    console.log("\n✅ Voter registered!")
    console.log("   publicKeyHash:    ", publicKeyHash)
    console.log("   ageCommitment:    ", ageCommitment)
    console.log("   dilithiumKeyHash: ", dilithiumKeyHash)
    console.log("\nRegister this on-chain:")
    console.log(`   voting.registerVoter("${dilithiumKeyHash}")`)
}

register().catch(console.error)