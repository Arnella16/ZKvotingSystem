// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./AgeVerifier.sol";

contract Voting {
    Groth16Verifier public verifier;
    
    mapping(bytes32 => bool) public nullifiers;
    mapping(string => uint256) public votes;
    
    constructor(address verifierAddress) {
        verifier = Groth16Verifier(verifierAddress);
    }
    
    function castVote(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[4] memory publicSignals,
        bytes32 nullifier,
        string memory candidate
    ) public {
        // Check proof is valid
        require(
            verifier.verifyProof(a, b, c, publicSignals),
            "Invalid proof"
        );
        
        // Check not already voted
        require(!nullifiers[nullifier], "Already voted");
        
        // Record nullifier and vote
        nullifiers[nullifier] = true;
        votes[candidate]++;
    }
    
    function getResults(string memory candidate) 
        public view returns (uint256) {
        return votes[candidate];
    }
}
