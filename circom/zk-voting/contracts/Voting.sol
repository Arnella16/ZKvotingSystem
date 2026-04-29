// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./AgeVerifier.sol";

contract HybridVoting {
    Groth16Verifier public verifier;
    
    // Store Dilithium public key HASHES (not full keys)
    mapping(address => uint256) public dilithiumKeyHashes;
    mapping(bytes32 => bool) public nullifiers;
    mapping(string => uint256) public votes;
    
    constructor(address verifierAddress) {
        verifier = Groth16Verifier(verifierAddress);
    }
    
    // Voter registers their Dilithium public key hash
    function registerVoter(uint256 dilithiumKeyHash) public {
        dilithiumKeyHashes[msg.sender] = dilithiumKeyHash;
    }
    
    function castVote(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[5] memory publicSignals, // now 5 signals including dilithiumKeyHash
        bytes32 nullifier,
        string memory candidate
    ) public {
        // Check voter is registered
        require(
            dilithiumKeyHashes[msg.sender] != 0,
            "Voter not registered"
        );
        
        // Check dilithiumKeyHash in proof matches registered one
        require(
            publicSignals[3] == dilithiumKeyHashes[msg.sender],
            "Dilithium key mismatch"
        );
        
        // Verify ZK proof
        require(
            verifier.verifyProof(a, b, c, publicSignals),
            "Invalid proof"
        );
        
        // Check not double voted
        require(!nullifiers[nullifier], "Already voted");
        
        // Record and count
        nullifiers[nullifier] = true;
        votes[candidate]++;
        
        emit VoteCast(candidate, nullifier);
    }
    
    event VoteCast(string candidate, bytes32 nullifier);
    
    function getResults(string memory candidate) 
        public view returns (uint256) {
        return votes[candidate];
    }
}