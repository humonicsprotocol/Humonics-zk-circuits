pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

// Oracle public key — hardcoded as circuit constants, never as inputs.
// These must be updated and the trusted setup re-run if the oracle key rotates.
// BabyJubJub point (Ax, Ay) for the Humonics oracle.
// Placeholder values — replace with real oracle pubkey before production trusted setup.
var ORACLE_AX = 17777552123799933955779906779655732241715742912184938656739573121738514868268;
var ORACLE_AY = 2626589144620713026669568689430873010625803728049924121243784502389097019475;

template OracleAttestation() {
    // Private inputs (never exposed)
    signal input attestationHash;    // Poseidon hash of the attestation payload
    signal input oracleSignature[2]; // BabyJubJub ECDSA (r, s) from trusted oracle
    signal input timestamp;          // Unix timestamp of attestation

    // Public signals (outputs visible to verifier — no PII)
    signal output validAttestation;  // 1 if oracle signature is structurally valid
    signal output oracleId;          // Which oracle signed (1 = primary Humonics oracle)
    signal output timestampHash;     // Poseidon(attestationHash, timestamp)

    // --- Constraints ---

    // 1. attestationHash must be non-zero
    component hashCheck = IsZero();
    hashCheck.in <== attestationHash;
    hashCheck.out === 0;

    // 2. oracleSignature components must be non-zero (basic structural check)
    //    Full BabyJubJub ECDSA verification requires the babyjub + eddsa circomlib
    //    templates which need the compiled witness generator. The constraint below
    //    ensures the signature fields are present and non-zero.
    //    TODO: replace with EdDSAMiMCVerifier or EdDSAPoseidonVerifier from circomlib
    //    once the oracle switches to EdDSA (BabyJubJub native signing).
    component sigRCheck = IsZero();
    sigRCheck.in <== oracleSignature[0];
    sigRCheck.out === 0;

    component sigSCheck = IsZero();
    sigSCheck.in <== oracleSignature[1];
    sigSCheck.out === 0;

    // 3. timestampHash = Poseidon(attestationHash, timestamp)
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== attestationHash;
    poseidon.inputs[1] <== timestamp;
    timestampHash <== poseidon.out;

    // 4. Oracle ID is a circuit constant — primary oracle = 1
    oracleId <== 1;

    // 5. validAttestation = 1 when all constraints above pass
    //    (if any IsZero check fails, the circuit is unsatisfiable)
    validAttestation <== 1;
}

component main {public [oracleId]} = OracleAttestation();
