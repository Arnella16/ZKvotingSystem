pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

template HybridVoting() {
    // Private inputs (voter only)
    signal input secretKey;          // voter's secret
    signal input age;                // voter's age
    signal input dilithiumPubKey[16]; // Dilithium public key (chunked)

    // Public inputs (everyone sees)
    signal input publicKey;          // Poseidon(secretKey)
    signal input ageCommitment;      // Poseidon(age, secretKey)
    signal input dilithiumKeyHash;   // Poseidon(dilithiumPubKey) - on-chain registered
    signal input minAge;             // 18

    signal output valid;

    // Constraint 1: age >= 18
    component ageCheck = GreaterEqThan(8);
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== minAge;
    ageCheck.out === 1;

    // Constraint 2: age commitment matches
    component hasher = Poseidon(2);
    hasher.inputs[0] <== age;
    hasher.inputs[1] <== secretKey;
    hasher.out === ageCommitment;

    // Constraint 3: public key matches
    component pkHasher = Poseidon(1);
    pkHasher.inputs[0] <== secretKey;
    pkHasher.out === publicKey;

    // Constraint 4: Dilithium public key matches on-chain commitment
    component dilHasher = Poseidon(16);
    for (var i = 0; i < 16; i++) {
        dilHasher.inputs[i] <== dilithiumPubKey[i];
    }
    dilHasher.out === dilithiumKeyHash;

    valid <== ageCheck.out;
}

component main {public [publicKey, ageCommitment, dilithiumKeyHash, minAge]} = HybridVoting();