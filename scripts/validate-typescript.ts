import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";

const SRC_DIR = "src";

interface ValidationResult {
  file: string;
  success: boolean;
  errors?: string;
}

async function getSkillDirs(): Promise<string[]> {
  const entries = await readdir(SRC_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function getTypeScriptFiles(skillDir: string): Promise<string[]> {
  const codeDir = join(SRC_DIR, skillDir, "code", "typescript");
  try {
    const entries = await readdir(codeDir);
    return entries.filter((f) => f.endsWith(".ts")).map((f) => join(codeDir, f));
  } catch {
    return [];
  }
}

async function validateFile(filePath: string): Promise<ValidationResult> {
  try {
    execSync(`npx tsc --noEmit --strict --esModuleInterop --module esnext --moduleResolution bundler --target es2022 "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });
    return { file: filePath, success: true };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    const errorOutput = error.stdout || error.stderr || "Unknown error";
    // Filter out errors from node_modules (dependency type issues)
    // TypeScript errors start with "path(line,col): error TS..."
    // Split on these boundaries and filter out node_modules errors
    const errorPattern = /^(\S+\.\w+\(\d+,\d+\): error TS\d+:[\s\S]*?)(?=^\S+\.\w+\(\d+,\d+\): error TS\d+:|$)/gm;
    const errors: string[] = [];
    let match;
    while ((match = errorPattern.exec(errorOutput)) !== null) {
      const errorBlock = match[1].trim();
      if (!errorBlock.startsWith("node_modules/")) {
        errors.push(errorBlock);
      }
    }
    if (errors.length > 0) {
      return { file: filePath, success: false, errors: errors.join("\n\n") };
    }
    return { file: filePath, success: true };
  }
}

async function main(): Promise<void> {
  console.log("Validating TypeScript code examples...\n");

  const skillDirs = await getSkillDirs();
  const allResults: ValidationResult[] = [];

  for (const skillDir of skillDirs) {
    const tsFiles = await getTypeScriptFiles(skillDir);

    for (const file of tsFiles) {
      console.log(`Checking: ${file}`);
      const result = await validateFile(file);
      allResults.push(result);

      if (result.success) {
        console.log(`  ✓ Valid\n`);
      } else {
        console.log(`  ✗ Errors found:\n${result.errors}\n`);
      }
    }
  }

  // Summary
  const failed = allResults.filter((r) => !r.success);
  console.log("\n---");
  console.log(`Total files: ${allResults.length}`);
  console.log(`Passed: ${allResults.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
