#!/bin/bash

# Compile all Circom circuits to R1CS + WASM
set -e

echo "🔧 Compiling Humonics zk-circuits..."

# Ensure artifacts directories exist
mkdir -p artifacts/human_auth
mkdir -p artifacts/content_binding
mkdir -p artifacts/oracle_attestation

# Compile human_auth.circom
echo "📝 Compiling human_auth.circom..."
circom circuits/human_auth.circom --r1cs --wasm --sym -o artifacts/human_auth/
echo "✅ human_auth.circom compiled successfully"

# Compile content_binding.circom
echo "📝 Compiling content_binding.circom..."
circom circuits/content_binding.circom --r1cs --wasm --sym -o artifacts/content_binding/
echo "✅ content_binding.circom compiled successfully"

# Compile oracle_attestation.circom
echo "📝 Compiling oracle_attestation.circom..."
circom circuits/oracle_attestation.circom --r1cs --wasm --sym -o artifacts/oracle_attestation/
echo "✅ oracle_attestation.circom compiled successfully"

# Generate information about each circuit
echo ""
echo "📊 Circuit Information:"
echo "======================"

for circuit in human_auth content_binding oracle_attestation; do
    echo "🔍 $circuit circuit:"
    snarkjs info -r artifacts/$circuit/${circuit}.r1cs | head -5
    echo ""
done

echo "🎉 All circuits compiled successfully!"
echo "📁 Artifacts available in artifacts/ directory"
echo "🚀 Run './scripts/trusted_setup.sh' to generate proving/verification keys"
