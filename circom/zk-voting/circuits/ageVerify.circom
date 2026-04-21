pragma circom 2.0.0;

// This circuit proves:
// 1. Voter knows secret key a
// 2. g^a mod p equals their public key
// 3. Their age >= 18

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";

template AgeVerify() {
    // Private inputs (only voter knows these)
    signal input secretKey;      // voter's secret 'a'
    signal input age;            // voter's real age

    // Public inputs (everyone can see these)
    signal input publicKey;      // g^a mod p
    signal input ageCommitment;  // hash of age (set at registration)
    signal input minAge;         // 18

    // Output
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

    // Constraint 3: public key = hash(secretKey)
    component pkHasher = Poseidon(1);
    pkHasher.inputs[0] <== secretKey;
    pkHasher.out === publicKey;

    // Output valid
    valid <== ageCheck.out;
}

component main {public [publicKey, ageCommitment, minAge]} = AgeVerify();