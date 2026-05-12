# Humonics zk-Circuits

Zero-knowledge circuits for the Humonics protocol - proving human verification without revealing identity.

## Overview

This repository contains the cryptographic heart of the Humonics protocol, implementing zero-knowledge circuits that prove a human completed verification without exposing personally identifiable information (PII).

## Architecture

### Circuits

- **`human_auth.circom`** - Proves biometric + oracle attestation without revealing identity
- **`content_binding.circom`** - Binds content hash to verified DID 
- **`oracle_attestation.circom`** - Validates oracle signature without revealing signed payload

### Security Principles

- ✅ **No PII exposure** - All identity data remains private
- ✅ **Minimal public signals** - Only essential data is revealed
- ✅ **Replay protection** - Nonces prevent replay attacks
- ✅ **Oracle verification** - Trusted oracle signatures are validated

## Setup

### Prerequisites

- Node.js >= 18
- Circom 2.1.8+
- Rust (for some circomlib dependencies)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd zk-circuits

# Install dependencies
npm install

# Install circom globally (if not already installed)
npm install -g circom
```

### Quick Start

```bash
# Compile all circuits
npm run compile

# Run trusted setup (requires Powers of Tau file)
npm run setup

# Run tests
npm test
```

## Development Workflow

### 1. Circuit Development

Circuits are written in Circom 2.0 and located in the `circuits/` directory:

```bash
circuits/
├── human_auth.circom         # Main human authentication circuit
├── content_binding.circom    # Content-to-human binding
└── oracle_attestation.circom # Oracle signature verification
```

### 2. Compilation

Compile circuits to R1CS and WASM:

```bash
# Compile all circuits
./scripts/compile.sh

# Or use npm script
npm run compile
```

This generates:
- `*.r1cs` - Rank-1 Constraint System files
- `*.wasm` - WebAssembly files for proof generation
- `*.sym` - Symbol files for debugging

### 3. Trusted Setup

Perform the trusted setup ceremony:

```bash
# Download Powers of Tau (phase 1)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau -O pot12_0000.ptau

# Run circuit-specific setup (phase 2)
./scripts/trusted_setup.sh

# Or use npm script
npm run setup
```

This generates:
- `*_final.zkey` - Proving keys (keep secure!)
- `verification_key.json` - Verification keys
- `verifier.sol` - Solidity verifier contracts

### 4. Testing

Run comprehensive tests:

```bash
# Run all tests
npm test

# Run specific circuit tests
npm run test:human
npm run test:content
npm run test:oracle
```

## Circuit Details

### human_auth.circom

**Purpose**: Prove human authentication without revealing identity

**Private Inputs**:
- `biometricHash` - Salted hash of biometric probe
- `deviceBinding` - Device keypair commitment
- `oracleSignature[2]` - ECDSA signature from trusted oracle
- `did` - Creator's Stellar DID
- `nonce` - One-time nonce preventing replay

**Public Outputs**:
- `humanCommitment` - Poseidon(did, nonce)
- `contentHash` - SHA-256 of certified content
- `timestamp` - Unix timestamp of attestation

### content_binding.circom

**Purpose**: Bind content to verified human without revealing which human

**Private Inputs**:
- `did` - Creator's Stellar DID
- `humanCommitment` - From human_auth.circom output

**Public Outputs**:
- `contentHash` - SHA-256 of content being certified
- `certCommitment` - Poseidon(contentHash, humanCommitment, timestamp)
- `timestamp` - Unix timestamp of binding

### oracle_attestation.circom

**Purpose**: Validate oracle signature without revealing signed payload

**Private Inputs**:
- `attestationHash` - Hash of attestation data
- `oracleSignature[2]` - ECDSA signature from trusted oracle
- `timestamp` - Unix timestamp of attestation

**Public Outputs**:
- `validAttestation` - Boolean indicating signature validity
- `oracleId` - Identifier of which oracle signed
- `timestampHash` - Hash of timestamp for verification

## Security Considerations

### Critical Security Rules

1. **Never commit .zkey files** - Only commit their SHA-256 hashes
2. **Never expose PII** - All identity data must remain private
3. **Always use nonces** - Prevent replay attacks
4. **Validate timestamps** - Prevent old/future timestamps
5. **Hardcode oracle keys** - Never accept oracle keys as inputs

### Threat Mitigations

- **Replay attacks** - Nonces and timestamp validation
- **Identity exposure** - Zero-knowledge proofs hide all PII
- **Oracle compromise** - Multiple oracle redundancy
- **Circuit bugs** - Comprehensive test coverage

## Integration

### Proof Generation

```typescript
import { verifier } from './scripts/verify';

// Generate proof
const proofData = await verifier.generateProof('human_auth', inputs);

// Verify proof
const result = await verifier.verifyHumanAuth(proofData);
```

### Smart Contract Integration

The generated `verifier.sol` contracts can be deployed to Soroban/EVM chains for on-chain verification.

## File Structure

```
zk-circuits/
├── circuits/                  # Circom circuit files
│   ├── human_auth.circom
│   ├── content_binding.circom
│   └── oracle_attestation.circom
├── scripts/                   # Build and utility scripts
│   ├── compile.sh
│   ├── trusted_setup.sh
│   └── verify.ts
├── tests/                     # Test files
│   ├── *.test.ts
│   └── fixtures/
├── artifacts/                  # Compiled output (gitignored)
│   ├── human_auth/
│   ├── content_binding/
│   └── oracle_attestation/
├── CLAUDE.md                  # AI assistant instructions
└── README.md                  # This file
```

## Dependencies

- **circom** - Circuit compilation
- **snarkjs** - Proof generation/verification
- **circomlib** - Standard circuit library
- **ffjavascript** - Finite field arithmetic

## Contributing

1. Follow the circuit design rules in `CLAUDE.md`
2. Add comprehensive tests for any new circuits
3. Never commit sensitive artifacts (.zkey files)
4. Update documentation for any API changes

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:
- Review the test files for usage examples
- Check the circuit files for implementation details
- Refer to `CLAUDE.md` for development guidelines
