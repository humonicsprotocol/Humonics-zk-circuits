import { verifier } from '../scripts/verify';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as snarkjs from 'snarkjs';

const testInputs = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/test_inputs.json'), 'utf8')
);

describe('HumanAuth Circuit Tests', () => {
  let wasmPath: string;
  let zkeyPath: string;

  beforeAll(() => {
    wasmPath = join(__dirname, '../artifacts/human_auth/human_auth.wasm');
    zkeyPath = join(__dirname, '../artifacts/human_auth/human_auth_final.zkey');
  });

  test('Valid proof should verify successfully', async () => {
    const input = testInputs.human_auth.valid;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyHumanAuth({ proof, publicSignals });
    
    expect(result.valid).toBe(true);
    expect(result.publicSignals).toHaveLength(3);
    expect(result.publicSignals![0]).toBeTruthy(); // humanCommitment
    expect(result.publicSignals![1]).toBeTruthy(); // out_contentHash
    expect(result.publicSignals![2]).toBeTruthy(); // out_timestamp
  });

  test('Invalid biometric hash should fail verification', async () => {
    const input = testInputs.human_auth.invalid_biometric;
    
    try {
      await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
      fail('Expected proof generation to fail');
    } catch (error) {
      // Circuit should reject invalid biometric hash
      expect(error).toBeTruthy();
    }
  });

  test('Replayed nonce should fail verification', async () => {
    const input = testInputs.human_auth.replayed_nonce;
    
    try {
      await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
      fail('Expected proof generation to fail');
    } catch (error) {
      // Circuit should reject zero nonce
      expect(error).toBeTruthy();
    }
  });

  test('Wrong oracle key should fail verification', async () => {
    const input = testInputs.human_auth.wrong_oracle_key;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyHumanAuth({ proof, publicSignals });
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('signature');
  });

  test('Timestamp validation should reject old timestamps', async () => {
    const input = { ...testInputs.human_auth.valid };
    input.timestamp = '1640995200'; // Jan 1, 2022 (too old)
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyHumanAuth({ proof, publicSignals });
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Timestamp');
  });

  test('Timestamp validation should reject future timestamps', async () => {
    const input = { ...testInputs.human_auth.valid };
    input.timestamp = (Math.floor(Date.now() / 1000) + 86400).toString(); // Tomorrow
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyHumanAuth({ proof, publicSignals });
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Timestamp');
  });

  test('Zero content hash should fail verification', async () => {
    const input = { ...testInputs.human_auth.valid };
    input.contentHash = '0';
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyHumanAuth({ proof, publicSignals });
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Content hash');
  });

  test('Proof serialization and deserialization', async () => {
    const input = testInputs.human_auth.valid;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const proofData = { proof, publicSignals };
    const serialized = verifier.proofToJSON(proofData);
    const deserialized = verifier.proofFromJSON(serialized);
    
    const result1 = await verifier.verifyHumanAuth(proofData);
    const result2 = await verifier.verifyHumanAuth(deserialized);
    
    expect(result1.valid).toBe(result2.valid);
    expect(result1.publicSignals).toEqual(result2.publicSignals);
  });
});
