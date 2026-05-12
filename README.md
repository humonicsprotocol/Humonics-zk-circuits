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

- `biometricHash` - Salted hash of biometric probe
- `deviceBinding` - Device keypair commitment
- `oracleSignature[2]` - ECDSA signature from trusted oracle
- `did` - Creator's Stellar DID
- `nonce` - One-time nonce preventing replay

**Public Outputs:**

- `humanCommitment` - Poseidon(did, nonce)
- `contentHash` - SHA-256 of certified content
- `timestamp` - Unix timestamp of attestation

### Content Binding (`content_binding.circom`)

**Private Inputs:**

- `did` - Creator's Stellar DID
- `humanCommitment` - From human_auth.circom output

**Public Outputs:**

- `contentHash` - SHA-256 of content being certified
- `certCommitment` - Poseidon(contentHash, humanCommitment, timestamp)
- `timestamp` - Unix timestamp of binding

### Oracle Attestation (`oracle_attestation.circom`)

**Private Inputs:**

- `attestationHash` - Hash of attestation data
- `oracleSignature[2]` - ECDSA signature from trusted oracle

**Public Outputs:**

- `validAttestation` - Boolean indicating signature validity
- `oracleId` - Identifier of which oracle signed
- `timestampHash` - Hash of timestamp for verification

## Build System

```bash
# Compile all circuits
./scripts/compile.sh

# Run trusted setup (requires Powers of Tau)
./scripts/trusted_setup.sh

# Run tests
npm test
```

## Testing

Comprehensive test suite covering:

- **Valid proof generation and verification**
- **Invalid biometric scenarios**
- **Replay attack prevention**
- **Oracle signature validation**
- **Timestamp validation**

## Security

- **Zero-knowledge proofs** - Prove verification without revealing identity
- **Hardcoded oracle keys** - Never expose oracle keys as inputs
- **Nonce-based replay protection** - Prevents replay attacks
- **Minimal public signals** - Only essential data revealed

## Integration

The circuits are designed for seamless integration with:

- **Smart contract verification** - Generated Solidity verifiers
- **TypeScript helper** - Complete proof generation/verification API
- **Test fixtures** - Synthetic data (no real identity information)

## Dependencies

- **circom** - Circuit compilation (0.5.46)
- **snarkjs** - Proof generation and verification
- **circomlib** - Standard circuit library
- **Node.js >= 18** - Runtime environment

## Repository Structure

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
├── tests/                     # Test suite
│   ├── *.test.ts
│   └── fixtures/
├── artifacts/                  # Compiled output (gitignored)
│   ├── human_auth/
│   ├── content_binding/
│   └── oracle_attestation/
└── README.md                  # This file
```

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
