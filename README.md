# ZK Voting System with Dilithium

A privacy-preserving voting system that combines **Zero-Knowledge Proofs** (Groth16) with **Post-Quantum Cryptography** (Dilithium) on the Ethereum blockchain.

## What This Project Does

Voters can prove they are:
- Above 18 years old
- Have a valid identity (secret key)
- Own a registered Dilithium post-quantum key

**Without revealing** their actual age, secret key, or Dilithium private key to anyone.

---

## Tech Stack

| Layer | Tools |
|---|---|
| Circuit | Circom 2.0, circomlib |
| ZK Proof | Groth16, snarkjs |
| Hash Function | Poseidon |
| Post-Quantum | Dilithium (ML-DSA) |
| Blockchain | Solidity, Hardhat, ethers.js |
| Elliptic Curve | BN128 |

---

---

## Prerequisites

```bash
# Install Node.js (v18+)
# Install Rust (for circom)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install circom
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
cd ..

# Install snarkjs globally
npm install -g snarkjs

# Install project dependencies
cd zk-voting
npm install
```

---

## Full Setup and Run Guide

### Step 1: Start Local Blockchain

```bash
# Terminal 1 - keep this running
npx hardhat node
```

### Step 2: Compile Circuit

```bash
# Compile the ZK circuit
circom circuits/ageVerify.circom --r1cs --wasm --sym -o build/
```

### Step 3: Generate Proving Keys (Trusted Setup)

```bash
# Download powers of tau (if not already present)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau

# Generate zkey
snarkjs groth16 setup build/ageVerify.r1cs powersOfTau28_hez_final_12.ptau build/ageVerify_0000.zkey

# Contribute to ceremony
snarkjs zkey contribute build/ageVerify_0000.zkey build/ageVerify_final.zkey --name="contributor" -v

# Export verification key
snarkjs zkey export verificationkey build/ageVerify_final.zkey build/verification_key.json

# Export Solidity verifier
snarkjs zkey export solidityverifier build/ageVerify_final.zkey contracts/AgeVerifier.sol
```

### Step 4: Deploy Contracts

```bash
# Terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

Output:

Deploying Verifier...
Verifier deployed to: 0xVerifierAddress
Deploying Voting...
Voting deployed to: 0xVotingAddress

### Step 5: Register Voter

```bash
# Register with your age
# Usage: node register.js <age>
node register.js 25
```

Output:

```bash
Registering voter...
Age: <age>
Secret key: <secretKey>
Registration complete!
dilithiumKeyHash: <dilithiumKeyHash>
```

### Step 6: Register On-Chain

```bash
npx hardhat console --network localhost
```

```javascript
// Connect to deployed contracts
const verifier = await ethers.getContractAt("Groth16Verifier", "0xVerifierAddress")
const voting = await ethers.getContractAt("HybridVoting", "0xVotingAddress")

// Register voter with dilithiumKeyHash from register.js output
await voting.registerVoter("YOUR_DILITHIUM_KEY_HASH_HERE")
console.log("Voter registered!")
```

### Step 7: Generate Vote and ZK Proof

```bash
# Usage: node vote.js <candidate>
node vote.js Alice
# or
node vote.js Bob
```

Output:

```bash
Voting for: Alice
─────────────────────────────
Voter keys loaded
Vote signed with Dilithium
Candidate: Alice
Signature length: 4597 bytes
Dilithium signature valid? true
Generating ZK proof...
ZK proof generated
Vote package saved to vote_package.json
```

### Step 8: Submit Vote On-Chain

```bash
npx hardhat console --network localhost
```

```javascript
// Load proof files
const proof = JSON.parse(require("fs").readFileSync("proof.json"))
const pub = JSON.parse(require("fs").readFileSync("public.json"))

// Format proof for Solidity (pi_b needs to be reversed!)
const a = [proof.pi_a[0], proof.pi_a[1]]
const b = [
  [proof.pi_b[0][1], proof.pi_b[0][0]],
  [proof.pi_b[1][1], proof.pi_b[1][0]]
]
const c = [proof.pi_c[0], proof.pi_c[1]]

// Create unique nullifier (prevents double voting)
const nullifier = ethers.keccak256(ethers.toUtf8Bytes("voter1_alice"))

// Cast vote
const tx = await voting.castVote(a, b, c, pub, nullifier, "Alice")
await tx.wait()
console.log("✅ Vote cast!", tx.hash)
```

### Step 9: Check Results

```javascript
// In Hardhat console
const count = await voting.getResults("Alice")
console.log("Votes for Alice:", count.toString())
```

