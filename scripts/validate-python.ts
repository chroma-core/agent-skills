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

async function getPythonFiles(skillDir: string): Promise<string[]> {
  const codeDir = join(SRC_DIR, skillDir, "code", "python");
  try {
    const entries = await readdir(codeDir);
    return entries.filter((f) => f.endsWith(".py")).map((f) => join(codeDir, f));
  } catch {
    return [];
  }
}

function validateFile(filePath: string): ValidationResult {
  try {
    // Check syntax with py_compile
    execSync(`.venv/bin/python -m py_compile "${filePath}"`, {
      encoding: "utf-8",
      stdio: "pipe",
    });

    return { file: filePath, success: true };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    const errorOutput = error.stderr || error.stdout || "Unknown error";
    return { file: filePath, success: false, errors: errorOutput.trim() };
  }
}

async function main(): Promise<void> {
  console.log("Validating Python code examples...\n");

  const skillDirs = await getSkillDirs();
  const allResults: ValidationResult[] = [];

  for (const skillDir of skillDirs) {
    const pyFiles = await getPythonFiles(skillDir);

    for (const file of pyFiles) {
      console.log(`Checking: ${file}`);
      const result = validateFile(file);
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
