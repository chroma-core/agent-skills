import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import * as readline from "readline";

const SRC_DIR = "src";

interface TemplateInfo {
  name: string;
  description: string;
}

const SKILL_DIR = "chroma";

function parseArgs(): Partial<TemplateInfo> {
  const args = process.argv.slice(2);
  const result: Partial<TemplateInfo> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      result.name = args[++i];
    } else if (args[i] === "--description" && args[i + 1]) {
      result.description = args[++i];
    }
  }

  return result;
}

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateTemplateContent(info: TemplateInfo): string {
  return `---
name: ${info.name}
description: ${info.description}
---

## ${info.name}

${info.description}

### Example

{{CODE:example}}
`;
}

function generateTypescriptContent(): string {
  return `// @snippet:example
// TODO: Add TypeScript example code here
const example = "hello";
// @end
`;
}

function generatePythonContent(): string {
  return `# @snippet:example
# TODO: Add Python example code here
example = "hello"
# @end
`;
}

async function createTemplate(info: TemplateInfo): Promise<void> {
  const kebabName = toKebabCase(info.name);

  // Create directories
  const templatesDir = join(SRC_DIR, SKILL_DIR, "templates");
  const tsCodeDir = join(SRC_DIR, SKILL_DIR, "code", "typescript");
  const pyCodeDir = join(SRC_DIR, SKILL_DIR, "code", "python");

  await mkdir(templatesDir, { recursive: true });
  await mkdir(tsCodeDir, { recursive: true });
  await mkdir(pyCodeDir, { recursive: true });

  // Create template file
  const templatePath = join(templatesDir, `${kebabName}.md`);
  await writeFile(templatePath, generateTemplateContent(info), "utf-8");
  console.log(`Created: ${templatePath}`);

  // Create TypeScript code file
  const tsPath = join(tsCodeDir, `${kebabName}.ts`);
  await writeFile(tsPath, generateTypescriptContent(), "utf-8");
  console.log(`Created: ${tsPath}`);

  // Create Python code file
  const pyPath = join(pyCodeDir, `${kebabName}.py`);
  await writeFile(pyPath, generatePythonContent(), "utf-8");
  console.log(`Created: ${pyPath}`);
}

async function main(): Promise<void> {
  const args = parseArgs();

  // If all args provided, skip interactive mode
  if (args.name && args.description) {
    console.log("\nCreating template files...\n");
    await createTemplate(args as TemplateInfo);
    console.log("\nTemplate created successfully!");
    console.log(`\nNext steps:`);
    console.log(`  1. Edit the template in src/${SKILL_DIR}/templates/`);
    console.log(`  2. Add code examples in src/${SKILL_DIR}/code/typescript/`);
    console.log(`  3. Add code examples in src/${SKILL_DIR}/code/python/`);
    console.log(`  4. Run 'bun run build' to generate the skill files\n`);
    return;
  }

  const rl = createReadlineInterface();

  console.log("\nCreate New Template\n");

  const name =
    args.name || (await prompt(rl, "Template name (e.g., Regex Filtering): "));
  if (!name) {
    console.error("Error: Template name is required");
    rl.close();
    process.exit(1);
  }

  const description =
    args.description ||
    (await prompt(rl, "Description (e.g., Learn how to use regex filters): "));
  if (!description) {
    console.error("Error: Description is required");
    rl.close();
    process.exit(1);
  }

  rl.close();

  console.log("\nCreating template files...\n");

  await createTemplate({ name, description });

  console.log("\nTemplate created successfully!");
  console.log(`\nNext steps:`);
  console.log(`  1. Edit the template in src/${SKILL_DIR}/templates/`);
  console.log(`  2. Add code examples in src/${SKILL_DIR}/code/typescript/`);
  console.log(`  3. Add code examples in src/${SKILL_DIR}/code/python/`);
  console.log(`  4. Run 'bun run build' to generate the skill files\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
