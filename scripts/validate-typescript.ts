import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const OUTPUT_DIR = "skills";
const TARGET_FILE_NAME = "typescript.md";

interface ValidationResult {
  file: string;
  success: boolean;
  errors?: string;
}

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getMarkdownFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name === TARGET_FILE_NAME) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractCodeBlocks(content: string, language: string): string[] {
  const blocks: string[] = [];
  const pattern = new RegExp(`\\\`\\\`\\\`${language}\\n([\\s\\S]*?)\\n\\\`\\\`\\\``, "g");

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    blocks.push(match[1].trim());
  }

  return blocks;
}

async function validateFile(markdownPath: string): Promise<ValidationResult> {
  const content = await readFile(markdownPath, "utf-8");
  const codeBlocks = extractCodeBlocks(content, "typescript");

  if (codeBlocks.length === 0) {
    return { file: markdownPath, success: true };
  }

  const tempRoot = join(process.cwd(), ".tmp");
  await mkdir(tempRoot, { recursive: true });
  const tempDir = await mkdtemp(join(tempRoot, "agent-skills-ts-"));
  const tempFile = join(tempDir, "example.ts");
  const combinedProgram = codeBlocks.join("\n\n");

  try {
    await writeFile(tempFile, combinedProgram, "utf-8");
    execSync(
      `npx tsc --noEmit --strict --esModuleInterop --module esnext --moduleResolution bundler --target es2022 "${tempFile}"`,
      {
        encoding: "utf-8",
        stdio: "pipe",
      }
    );
    return { file: markdownPath, success: true };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    const errorOutput = error.stdout || error.stderr || "Unknown error";
    const relativeTempFile = relative(process.cwd(), tempFile);
    const relativeMarkdownPath = relative(process.cwd(), markdownPath);
    const normalizedOutput = errorOutput.split(tempFile).join(relativeMarkdownPath);
    const errorPattern =
      /^(\S+\.\w+\(\d+,\d+\): error TS\d+:[\s\S]*?)(?=^\S+\.\w+\(\d+,\d+\): error TS\d+:|$)/gm;
    const errors: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = errorPattern.exec(normalizedOutput)) !== null) {
      const errorBlock = match[1].trim();
      if (
        !errorBlock.startsWith("node_modules/") &&
        !errorBlock.startsWith(relativeTempFile)
      ) {
        errors.push(errorBlock);
      } else if (errorBlock.startsWith(relativeMarkdownPath)) {
        errors.push(errorBlock);
      }
    }

    return {
      file: markdownPath,
      success: errors.length === 0,
      errors: errors.length > 0 ? errors.join("\n\n") : undefined,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  console.log("Validating built TypeScript code examples...\n");

  const mdFiles = await getMarkdownFiles(OUTPUT_DIR);
  const allResults: ValidationResult[] = [];

  for (const file of mdFiles) {
    console.log(`Checking: ${file}`);
    const result = await validateFile(file);
    allResults.push(result);

    if (result.success) {
      console.log("  ✓ Valid\n");
    } else {
      console.log(`  ✗ Errors found:\n${result.errors}\n`);
    }
  }

  const failed = allResults.filter((result) => !result.success);
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
