# Contributing to Humonics zk-circuits

## Prerequisites

- Node.js ≥ 18
- Circom 2.1.8+ (`npm install -g circom`)
- Rust (required by some circomlib dependencies)
- SnarkJS (`npm install -g snarkjs`)

## Local setup

```bash
git clone git@github.com:humonicsprotocol/Humonics-zk-circuits.git
cd Humonics-zk-circuits
npm install

# Compile circuits to R1CS + WASM
./scripts/compile.sh

# Run trusted setup (Powers of Tau phase 1 must already exist)
./scripts/trusted_setup.sh

# Run tests (requires compiled artifacts)
npm test
```

## Branch naming

| Prefix | Use |
|---|---|
| `feat/` | New circuit or feature |
| `fix/` | Bug fix |
| `chore/` | Tooling, deps, config |
| `docs/` | Documentation only |

## Circuit development rules

- **Never add a public signal that reveals identity.** All PII stays private.
- **Never skip the nonce.** Replay attacks are a critical vulnerability.
- **Use Poseidon for all in-circuit hashing** — not SHA-256 (not ZK-friendly).
- **Oracle public keys are circuit constants** — never inputs.
- **Every new circuit must have tests** for: valid proof, invalid input, replayed nonce, wrong key.

## After changing a circuit

Any change to a `.circom` file invalidates the existing `.zkey`. You must:

1. Re-run `./scripts/compile.sh`
2. Re-run `./scripts/trusted_setup.sh`
3. Update `artifacts/checksums.txt` with the new `.zkey` SHA-256 hashes
4. **Never commit `.zkey` files** — only commit `checksums.txt`

## PR checklist

- [ ] `./scripts/compile.sh` succeeds
- [ ] `npm test` passes
- [ ] No public signal reveals identity data
- [ ] Nonce constraint is present on any circuit that accepts a nonce
- [ ] `artifacts/checksums.txt` updated if any circuit changed
- [ ] Trusted setup re-run if any circuit changed

## Security constraint (non-negotiable)

This is the cryptographic core of the protocol. A bug here breaks the entire privacy guarantee. If you are unsure about a constraint, ask before merging. When in doubt, add more constraints, not fewer.
