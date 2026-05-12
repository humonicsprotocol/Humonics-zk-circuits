pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template ContentBinding() {
    // Private inputs (never exposed)
    signal input did;                // Creator's Stellar DID (as field element)
    signal input humanCommitment;    // From human_auth.circom output

    // Semi-public inputs (provided by client, constrained by circuit)
    signal input contentHash;        // SHA-256 of the content being certified
    signal input timestamp;          // Unix timestamp of binding

    // Public signals (outputs visible to verifier — no PII)
    signal output out_contentHash;   // SHA-256 of the content being certified
    signal output certCommitment;    // Poseidon(contentHash, humanCommitment, timestamp)
    signal output out_timestamp;     // Unix timestamp of binding

    // --- Constraints ---

    // 1. contentHash must be non-zero
    component contentCheck = IsZero();
    contentCheck.in <== contentHash;
    contentCheck.out === 0;

    // 2. humanCommitment must be non-zero
    component commitCheck = IsZero();
    commitCheck.in <== humanCommitment;
    commitCheck.out === 0;

    // 3. certCommitment = Poseidon(contentHash, humanCommitment, timestamp)
    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== contentHash;
    poseidon.inputs[1] <== humanCommitment;
    poseidon.inputs[2] <== timestamp;
    certCommitment <== poseidon.out;

    // 4. Pass through content hash and timestamp as public signals
    out_contentHash <== contentHash;
    out_timestamp <== timestamp;

    // Constrain did so it is not ignored
    signal _did;
    _did <== did * 1;
}

component main {public [out_contentHash, out_timestamp]} = ContentBinding();
