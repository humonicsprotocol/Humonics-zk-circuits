import * as snarkjs from "snarkjs";
import { readFileSync } from "fs";
import { join } from "path";

export interface VerificationResult {
  valid: boolean;
  error?: string;
  publicSignals?: string[];
}

export interface ProofData {
  proof: any;
  publicSignals: string[];
}

export class ZKVerifier {
  private verificationKeys: Map<string, any> = new Map();

  constructor() {
    this.loadVerificationKeys();
  }

  private loadVerificationKeys(): void {
    try {
      // Load verification keys for all circuits
      const circuits = ["human_auth", "content_binding", "oracle_attestation"];

      for (const circuit of circuits) {
        const vkPath = join(
          __dirname,
          `../artifacts/${circuit}/verification_key.json`,
        );

        // Check if verification key exists before trying to load
        if (require("fs").existsSync(vkPath)) {
          const vkData = readFileSync(vkPath, "utf8");
          this.verificationKeys.set(circuit, JSON.parse(vkData));
        } else {
          console.warn(
            `⚠️  Verification key not found for ${circuit}: ${vkPath}`,
          );
          console.warn(
            `💡 Run 'npm run compile && npm run setup' to generate verification keys`,
          );
        }
      }

      console.log("✅ Verification keys loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load verification keys:", error);
      throw error;
    }
  }

  /**
   * Verify a Groth16 proof for a specific circuit
   */
  async verifyProof(
    circuitName: string,
    proofData: ProofData,
  ): Promise<VerificationResult> {
    try {
      const vk = this.verificationKeys.get(circuitName);
      if (!vk) {
        throw new Error(
          `Verification key not found for circuit: ${circuitName}`,
        );
      }

      const isValid = await snarkjs.groth16.verify(
        vk,
        proofData.publicSignals,
        proofData.proof,
      );

      return {
        valid: isValid,
        publicSignals: proofData.publicSignals,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error ? error.message : "Unknown verification error",
      };
    }
  }

  /**
   * Verify human authentication proof
   */
  async verifyHumanAuth(proofData: ProofData): Promise<VerificationResult> {
    const result = await this.verifyProof("human_auth", proofData);

    if (result.valid && result.publicSignals) {
      // Additional validation for human auth specific constraints
      const [humanCommitment, contentHash, timestamp] = result.publicSignals;

      // Validate timestamp is reasonable (not too old or in future)
      const now = Math.floor(Date.now() / 1000);
      const timestampNum = parseInt(timestamp);
      const maxAge = 24 * 60 * 60; // 24 hours

      if (timestampNum > now || timestampNum < now - maxAge) {
        return {
          valid: false,
          error: "Timestamp is out of valid range",
        };
      }

      // Validate contentHash is not zero
      if (contentHash === "0") {
        return {
          valid: false,
          error: "Content hash cannot be zero",
        };
      }
    }

    return result;
  }

  /**
   * Verify content binding proof
   */
  async verifyContentBinding(
    proofData: ProofData,
  ): Promise<VerificationResult> {
    const result = await this.verifyProof("content_binding", proofData);

    if (result.valid && result.publicSignals) {
      const [contentHash, certCommitment, timestamp] = result.publicSignals;

      // Validate contentHash is not zero
      if (contentHash === "0") {
        return {
          valid: false,
          error: "Content hash cannot be zero",
        };
      }

      // Validate timestamp is reasonable
      const now = Math.floor(Date.now() / 1000);
      const timestampNum = parseInt(timestamp);
      const maxAge = 7 * 24 * 60 * 60; // 7 days

      if (timestampNum > now || timestampNum < now - maxAge) {
        return {
          valid: false,
          error: "Timestamp is out of valid range",
        };
      }
    }

    return result;
  }

  /**
   * Verify oracle attestation proof
   */
  async verifyOracleAttestation(
    proofData: ProofData,
  ): Promise<VerificationResult> {
    const result = await this.verifyProof("oracle_attestation", proofData);

    if (result.valid && result.publicSignals) {
      const [validAttestation, oracleId, timestampHash] = result.publicSignals;

      // Ensure attestation is marked as valid
      if (validAttestation !== "1") {
        return {
          valid: false,
          error: "Oracle attestation is not valid",
        };
      }

      // Ensure oracle ID is valid (1, 2, or 3)
      const oracleIdNum = parseInt(oracleId);
      if (oracleIdNum < 1 || oracleIdNum > 3) {
        return {
          valid: false,
          error: "Invalid oracle ID",
        };
      }
    }

    return result;
  }

  /**
   * Generate a proof for testing purposes
   */
  async generateProof(circuitName: string, inputs: any): Promise<ProofData> {
    try {
      const wasmPath = join(
        __dirname,
        `../artifacts/${circuitName}/${circuitName}.wasm`,
      );
      const zkeyPath = join(
        __dirname,
        `../artifacts/${circuitName}/${circuitName}_final.zkey`,
      );

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        inputs,
        wasmPath,
        zkeyPath,
      );

      return { proof, publicSignals };
    } catch (error) {
      throw new Error(`Failed to generate proof for ${circuitName}: ${error}`);
    }
  }

  /**
   * Convert proof to JSON format for transmission
   */
  proofToJSON(proofData: ProofData): string {
    return JSON.stringify(proofData, null, 2);
  }

  /**
   * Parse proof from JSON format
   */
  proofFromJSON(jsonString: string): ProofData {
    return JSON.parse(jsonString);
  }
}

// Export singleton instance
export const verifier = new ZKVerifier();

// CLI utility for verification
if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);

    if (args.length !== 2) {
      console.error(
        "Usage: ts-node verify.ts <circuit_name> <proof_file.json>",
      );
      process.exit(1);
    }

    const [circuitName, proofFile] = args;

    try {
      const proofData = JSON.parse(readFileSync(proofFile, "utf8"));

      let result: VerificationResult;
      switch (circuitName) {
        case "human_auth":
          result = await verifier.verifyHumanAuth(proofData);
          break;
        case "content_binding":
          result = await verifier.verifyContentBinding(proofData);
          break;
        case "oracle_attestation":
          result = await verifier.verifyOracleAttestation(proofData);
          break;
        default:
          result = await verifier.verifyProof(circuitName, proofData);
      }

      if (result.valid) {
        console.log("✅ Proof is valid");
        console.log("📋 Public signals:", result.publicSignals);
      } else {
        console.log("❌ Proof is invalid");
        console.log("🚫 Error:", result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Verification failed:", error);
      process.exit(1);
    }
  })();
}
