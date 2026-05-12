import { verifier } from '../scripts/verify';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as snarkjs from 'snarkjs';

const testInputs = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/test_inputs.json'), 'utf8')
);

describe('OracleAttestation Circuit Tests', () => {
  let wasmPath: string;
  let zkeyPath: string;

  beforeAll(() => {
    wasmPath = join(__dirname, '../artifacts/oracle_attestation/oracle_attestation.wasm');
    zkeyPath = join(__dirname, '../artifacts/oracle_attestation/oracle_attestation_final.zkey');
  });

  test('Valid proof should verify successfully', async () => {
    const input = testInputs.oracle_attestation.valid;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyOracleAttestation({ proof, publicSignals });
    
    expect(result.valid).toBe(true);
    expect(result.publicSignals).toHaveLength(3);
    expect(result.publicSignals![0]).toBe('1'); // validAttestation
    expect(result.publicSignals![1]).toBeTruthy(); // oracleId
    expect(result.publicSignals![2]).toBeTruthy(); // timestampHash
  });

  test('Invalid signature should fail verification', async () => {
    const input = testInputs.oracle_attestation.invalid_signature;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyOracleAttestation({ proof, publicSignals });
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not valid');
  });

  test('Oracle ID validation should work correctly', async () => {
    const input = testInputs.oracle_attestation.valid;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyOracleAttestation({ proof, publicSignals });
    
    expect(result.valid).toBe(true);
    
    // Oracle ID should be between 1 and 3
    const oracleId = parseInt(result.publicSignals![1]);
    expect(oracleId).toBeGreaterThanOrEqual(1);
    expect(oracleId).toBeLessThanOrEqual(3);
  });

  test('Proof serialization and deserialization', async () => {
    const input = testInputs.oracle_attestation.valid;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const proofData = { proof, publicSignals };
    const serialized = verifier.proofToJSON(proofData);
    const deserialized = verifier.proofFromJSON(serialized);
    
    const result1 = await verifier.verifyOracleAttestation(proofData);
    const result2 = await verifier.verifyOracleAttestation(deserialized);
    
    expect(result1.valid).toBe(result2.valid);
    expect(result1.publicSignals).toEqual(result2.publicSignals);
  });
});
