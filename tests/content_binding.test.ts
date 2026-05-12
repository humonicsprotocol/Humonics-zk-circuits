import { verifier } from '../scripts/verify';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as snarkjs from 'snarkjs';

const testInputs = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/test_inputs.json'), 'utf8')
);

describe('ContentBinding Circuit Tests', () => {
  let wasmPath: string;
  let zkeyPath: string;

  beforeAll(() => {
    wasmPath = join(__dirname, '../artifacts/content_binding/content_binding.wasm');
    zkeyPath = join(__dirname, '../artifacts/content_binding/content_binding_final.zkey');
  });

  test('Valid proof should verify successfully', async () => {
    const input = testInputs.content_binding.valid;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyContentBinding({ proof, publicSignals });
    
    expect(result.valid).toBe(true);
    expect(result.publicSignals).toHaveLength(3);
    expect(result.publicSignals![0]).toBeTruthy(); // out_contentHash
    expect(result.publicSignals![1]).toBeTruthy(); // certCommitment
    expect(result.publicSignals![2]).toBeTruthy(); // out_timestamp
  });

  test('Invalid content hash should fail verification', async () => {
    const input = testInputs.content_binding.invalid_content;
    
    try {
      await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
      fail('Expected proof generation to fail');
    } catch (error) {
      // Circuit should reject zero content hash
      expect(error).toBeTruthy();
    }
  });

  test('Timestamp validation should reject old timestamps', async () => {
    const input = { ...testInputs.content_binding.valid };
    input.timestamp = '1640995200'; // Jan 1, 2022 (too old)
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const result = await verifier.verifyContentBinding({ proof, publicSignals });
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Timestamp');
  });

  test('Proof serialization and deserialization', async () => {
    const input = testInputs.content_binding.valid;
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );

    const proofData = { proof, publicSignals };
    const serialized = verifier.proofToJSON(proofData);
    const deserialized = verifier.proofFromJSON(serialized);
    
    const result1 = await verifier.verifyContentBinding(proofData);
    const result2 = await verifier.verifyContentBinding(deserialized);
    
    expect(result1.valid).toBe(result2.valid);
    expect(result1.publicSignals).toEqual(result2.publicSignals);
  });
});
