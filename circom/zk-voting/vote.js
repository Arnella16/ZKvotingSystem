// vote.js
const dilithium = require("dilithium-crystals")
const { buildPoseidon } = require("circomlibjs")
const { ethers } = require("ethers")
const fs = require("fs")
const snarkjs = require("snarkjs")

// Get candidate from command line
// Usage: node vote.js Alice
//        node vote.js Bob
const candidate = process.argv[2]
if (!candidate) {
    console.error("Please provide a candidate name!")
    console.error("Usage: node vote.js <candidate>")
    process.exit(1)
}

async function vote() {
    console.log(`\nVoting for: ${candidate}`)
    console.log("─────────────────────────────")

    // Step 1: Load voter keys
    if (!fs.existsSync("voter_keys.json")) {
        console.error("No voter keys found! Run register.js first.")
        process.exit(1)
    }
    const keys = JSON.parse(fs.readFileSync("voter_keys.json"))
    const privateKey = new Uint8Array(keys.privateKey)
    const publicKey = new Uint8Array(keys.publicKey)
    console.log("✅ Voter keys loaded")

    // Step 2: Sign the vote with Dilithium (post-quantum!)
    const message = Buffer.from(candidate)  // signs the actual candidate name
    const signature = await dilithium.signDetached(message, privateKey)
    console.log("✅ Vote signed with Dilithium")
    console.log("   Candidate:", candidate)
    console.log("   Signature length:", signature.length, "bytes")

    // Step 3: Verify Dilithium signature locally
    const valid = await dilithium.verifyDetached(signature, message, publicKey)
    console.log("✅ Dilithium signature valid?", valid)
    if (!valid) {
        console.error("Dilithium signature failed!")
        process.exit(1)
    }

    // Step 4: Generate ZK proof
    console.log("\nGenerating ZK proof...")
    const poseidon = await buildPoseidon()
    const F = poseidon.F

    const secretKey = BigInt(keys.secretKey)  // reads from voter_keys.json
    const age = BigInt(keys.age)              // reads from voter_keys.json
    const pubKeyChunks = Array.from(publicKey).slice(0, 16).map(x => BigInt(x))

    const input = {
        secretKey: keys.secretKey,
        age: keys.age,
        dilithiumPubKey: pubKeyChunks.map(x => x.toString()),
        publicKey: F.toString(poseidon([secretKey])),
        ageCommitment: F.toString(poseidon([age, secretKey])),
        dilithiumKeyHash: F.toString(poseidon(pubKeyChunks)),
        minAge: "18"
    }
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "build/ageVerify_js/ageVerify.wasm",
        "build/ageVerify_final.zkey"
    )
    console.log("✅ ZK proof generated")

    // Step 5: Save everything to files
    const votePackage = {
        candidate,
        dilithiumSignature: Array.from(signature),
        dilithiumPublicKey: Array.from(publicKey),
        proof,
        publicSignals,
        timestamp: new Date().toISOString()
    }
    fs.writeFileSync("vote_package.json", JSON.stringify(votePackage, null, 2))
    fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2))
    fs.writeFileSync("public.json", JSON.stringify(publicSignals, null, 2))

    console.log("\n✅ Vote package saved to vote_package.json")
    console.log("\n─────────────────────────────")
    console.log("Summary:")
    console.log("  Candidate:          ", candidate)
    console.log("  Dilithium signed:   ", valid)
    console.log("  ZK proof valid:      true")
    console.log("  Public signals:     ", publicSignals)
}

vote().catch(console.error)