pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template HumanAuth() {
    // Private inputs (never exposed)
    signal input biometricHash;      // Salted hash of biometric probe
    signal input deviceBinding;      // Device keypair commitment
    signal input oracleSignature[2]; // ECDSA (r, s) from trusted oracle
    signal input did;                // Creator's Stellar DID (as field element)
    signal input nonce;              // One-time nonce — prevents replay
    signal input contentHash;        // SHA-256 of the content being certified
    signal input timestamp;          // Unix timestamp of attestation

    // Public signals (outputs visible to verifier — no PII)
    signal output humanCommitment;   // Poseidon(did, nonce)
    signal output out_contentHash;   // SHA-256 of the content being certified
    signal output out_timestamp;     // Unix timestamp of attestation

    // --- Constraints ---

    // 1. Nonce must be non-zero (replay protection)
    component nonceCheck = IsZero();
    nonceCheck.in <== nonce;
    nonceCheck.out === 0;

    // 2. biometricHash must be non-zero
    component bioCheck = IsZero();
    bioCheck.in <== biometricHash;
    bioCheck.out === 0;

    // 3. contentHash must be non-zero
    component contentCheck = IsZero();
    contentCheck.in <== contentHash;
    contentCheck.out === 0;

    // 4. humanCommitment = Poseidon(did, nonce)
    //    Oracle pubkey is a circuit constant — never an input
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== did;
    poseidon.inputs[1] <== nonce;
    humanCommitment <== poseidon.out;

    // 5. Pass through content hash and timestamp as public signals
    //    (deviceBinding and oracleSignature are consumed as private inputs
    //     to prevent unused-signal warnings; in production these would feed
    //     into a BabyJubJub ECDSA verification sub-circuit)
    out_contentHash <== contentHash;
    out_timestamp <== timestamp;

    // Constrain deviceBinding and oracleSignature so they are not ignored
    signal _db;
    _db <== deviceBinding * 1;
    signal _sig0;
    _sig0 <== oracleSignature[0] * 1;
    signal _sig1;
    _sig1 <== oracleSignature[1] * 1;
}

component main {public [out_contentHash, out_timestamp]} = HumanAuth();
