import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import * as readline from "readline";

const SRC_DIR = "src";
const TARGET_TO_SKILL = {
  local: "chroma-local",
  cloud: "chroma-cloud",
  both: "chroma-shared",
} as const;
const VALID_SKILLS = new Set([
  "chroma-local",
  "chroma-cloud",
  "chroma-shared",
]);

interface TemplateInfo {
  name: string;
  description: string;
  skill: string;
}

type TemplateTarget = keyof typeof TARGET_TO_SKILL;

interface ParsedArgs extends Partial<TemplateInfo> {
  target?: TemplateTarget;
}

const DEFAULT_TARGET: TemplateTarget = "local";

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const result: ParsedArgs = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      result.name = args[++i];
    } else if (args[i] === "--description" && args[i + 1]) {
      result.description = args[++i];
    } else if (args[i] === "--skill" && args[i + 1]) {
      result.skill = args[++i];
    } else if (args[i] === "--target" && args[i + 1]) {
      result.target = normalizeTarget(args[++i]);
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

function normalizeTarget(value: string): TemplateTarget | undefined {
  const normalized = value.trim().toLowerCase();

  if (normalized === "local" || normalized === "cloud" || normalized === "both") {
    return normalized;
  }

  return undefined;
}

function resolveSkillDir(args: ParsedArgs): string {
  if (args.skill) {
    if (!VALID_SKILLS.has(args.skill)) {
      throw new Error(
        `Invalid skill directory "${args.skill}". Expected one of: ${Array.from(VALID_SKILLS).join(", ")}`
      );
    }
    return args.skill;
  }

  return TARGET_TO_SKILL[args.target ?? DEFAULT_TARGET];
}

function getTargetLabel(skill: string): string {
  if (skill === TARGET_TO_SKILL.local) {
    return "chroma local only";
  }

  if (skill === TARGET_TO_SKILL.cloud) {
    return "chroma cloud only";
  }

  if (skill === TARGET_TO_SKILL.both) {
    return "both chroma local and chroma cloud";
  }

  return skill;
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
  const templatesDir = join(SRC_DIR, info.skill, "templates");
  const tsCodeDir = join(SRC_DIR, info.skill, "code", "typescript");
  const pyCodeDir = join(SRC_DIR, info.skill, "code", "python");

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
    const skill = resolveSkillDir(args);
    console.log("\nCreating template files...\n");
    await createTemplate({
      name: args.name,
      description: args.description,
      skill,
    });
    console.log("\nTemplate created successfully!");
    console.log(`\nNext steps:`);
    console.log(`  1. Edit the template in src/${skill}/templates/ (${getTargetLabel(skill)})`);
    console.log(`  2. Add code examples in src/${skill}/code/typescript/`);
    console.log(`  3. Add code examples in src/${skill}/code/python/`);
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

  const interactiveTarget =
    args.skill
      ? undefined
      : args.target ??
        normalizeTarget(
          (await prompt(
            rl,
            "Target template scope ([local], cloud, both): "
          )) || DEFAULT_TARGET
        );

  if (!args.skill && !interactiveTarget) {
    console.error("Error: Target must be one of: local, cloud, both");
    rl.close();
    process.exit(1);
  }

  const skill = resolveSkillDir({
    ...args,
    target: interactiveTarget,
  });

  rl.close();

  console.log("\nCreating template files...\n");

  await createTemplate({ name, description, skill });

  console.log("\nTemplate created successfully!");
  console.log(`\nNext steps:`);
  console.log(`  1. Edit the template in src/${skill}/templates/ (${getTargetLabel(skill)})`);
  console.log(`  2. Add code examples in src/${skill}/code/typescript/`);
  console.log(`  3. Add code examples in src/${skill}/code/python/`);
  console.log(`  4. Run 'bun run build' to generate the skill files\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
