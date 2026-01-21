import { readdir, readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";

const SRC_DIR = "src";
const OUTPUT_DIR = "skills";
const LANGUAGES = ["typescript", "python"] as const;
const LANG_EXTENSIONS: Record<(typeof LANGUAGES)[number], string> = {
  typescript: "ts",
  python: "py",
};

type Language = (typeof LANGUAGES)[number];

interface TemplateInfo {
  name: string;
  description: string;
  fileName: string;
}

function parseFrontmatter(content: string): { name: string; description: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { name: "", description: "" };
  }

  const frontmatter = match[1];
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

  return {
    name: nameMatch ? nameMatch[1].trim() : "",
    description: descMatch ? descMatch[1].trim() : "",
  };
}

function parseSnippets(content: string): Map<string, string> {
  const snippets = new Map<string, string>();
  // Match @snippet:name followed by code until the line containing @end
  const regex = /@snippet:(\S+)\s*\n([\s\S]*?)\n\s*(?:\/\/|#)\s*@end/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const [, name, code] = match;
    snippets.set(name, code.trim());
  }

  return snippets;
}

function replaceCodePlaceholders(
  template: string,
  snippets: Map<string, string>,
  language: Language,
  templatePath: string
): string {
  const missingSnippets: string[] = [];

  const result = template.replace(/\{\{CODE:([^}]+)\}\}/g, (match, snippetName) => {
    const code = snippets.get(snippetName);
    if (!code) {
      missingSnippets.push(snippetName);
      return match;
    }
    const lang = language === "typescript" ? "typescript" : "python";
    return "```" + lang + "\n" + code + "\n```";
  });

  if (missingSnippets.length > 0) {
    throw new Error(
      `Missing snippets for ${language} in ${templatePath}: ${missingSnippets.join(", ")}`
    );
  }

  return result;
}

async function getSkillDirs(): Promise<string[]> {
  const entries = await readdir(SRC_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function getTemplates(skillDir: string): Promise<string[]> {
  const templatesDir = join(SRC_DIR, skillDir, "templates");
  try {
    const entries = await readdir(templatesDir);
    return entries.filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

async function loadSnippets(
  skillDir: string,
  language: Language,
  templateName: string
): Promise<Map<string, string>> {
  const ext = LANG_EXTENSIONS[language];
  const codeFile = join(
    SRC_DIR,
    skillDir,
    "code",
    language,
    templateName.replace(".md", `.${ext}`)
  );

  try {
    const content = await readFile(codeFile, "utf-8");
    return parseSnippets(content);
  } catch {
    console.warn(`Warning: Code file not found: ${codeFile}`);
    return new Map();
  }
}

async function buildSkill(skillDir: string): Promise<TemplateInfo[]> {
  const templates = await getTemplates(skillDir);
  const templateInfos: TemplateInfo[] = [];

  for (const templateFile of templates) {
    const templatePath = join(SRC_DIR, skillDir, "templates", templateFile);
    const template = await readFile(templatePath, "utf-8");
    const topicName = templateFile.replace(".md", "");

    // Parse frontmatter for template info
    const { name, description } = parseFrontmatter(template);
    templateInfos.push({ name, description, fileName: topicName });

    for (const language of LANGUAGES) {
      const snippets = await loadSnippets(skillDir, language, templateFile);
      const output = replaceCodePlaceholders(template, snippets, language, templatePath);

      const outputDir = join(OUTPUT_DIR, skillDir, topicName);
      await mkdir(outputDir, { recursive: true });

      const outputPath = join(outputDir, `${language}.md`);
      await writeFile(outputPath, output, "utf-8");
      console.log(`Generated: ${outputPath}`);
    }
  }

  return templateInfos;
}

interface GeneralFileInfo {
  name: string;
  description: string;
  fileName: string;
}

function generateSkillList(
  skillDir: string,
  templates: TemplateInfo[],
  generalFiles: GeneralFileInfo[]
): string {
  const lines: string[] = ["\n## Available Topics\n"];

  for (const language of LANGUAGES) {
    const langTitle = language.charAt(0).toUpperCase() + language.slice(1);
    lines.push(`### ${langTitle}\n`);

    for (const template of templates) {
      const path = `./${template.fileName}/${language}.md`;
      lines.push(`- [${template.name}](${path}) - ${template.description}`);
    }

    lines.push("");
  }

  if (generalFiles.length > 0) {
    lines.push("## General\n");
    for (const file of generalFiles) {
      lines.push(`- [${file.name}](./${file.fileName}) - ${file.description}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function copyGeneralMarkdownFiles(skillDir: string): Promise<GeneralFileInfo[]> {
  const generalDir = join(SRC_DIR, skillDir, "general");
  const outputDir = join(OUTPUT_DIR, skillDir);
  const generalFiles: GeneralFileInfo[] = [];

  try {
    const entries = await readdir(generalDir);
    const mdFiles = entries.filter((f) => f.endsWith(".md"));

    await mkdir(outputDir, { recursive: true });

    for (const mdFile of mdFiles) {
      const srcPath = join(generalDir, mdFile);
      const destPath = join(outputDir, mdFile);

      const content = await readFile(srcPath, "utf-8");
      const { name, description } = parseFrontmatter(content);
      generalFiles.push({ name, description, fileName: mdFile });

      await copyFile(srcPath, destPath);
      console.log(`Copied: ${destPath}`);
    }
  } catch {
    // No general directory, skip silently
  }

  return generalFiles;
}

async function copySkillMd(
  skillDir: string,
  templates: TemplateInfo[],
  generalFiles: GeneralFileInfo[]
): Promise<void> {
  const srcPath = join(SRC_DIR, skillDir, "SKILL.md");
  const destPath = join(OUTPUT_DIR, skillDir, "SKILL.md");

  try {
    const content = await readFile(srcPath, "utf-8");
    const skillList = generateSkillList(skillDir, templates, generalFiles);
    const output = content + skillList;

    await mkdir(join(OUTPUT_DIR, skillDir), { recursive: true });
    await writeFile(destPath, output, "utf-8");
    console.log(`Generated: ${destPath}`);
  } catch {
    console.warn(`Warning: SKILL.md not found for ${skillDir}`);
  }
}

async function main(): Promise<void> {
  console.log("Building skills...\n");

  const skillDirs = await getSkillDirs();

  for (const skillDir of skillDirs) {
    const templates = await buildSkill(skillDir);
    const generalFiles = await copyGeneralMarkdownFiles(skillDir);
    await copySkillMd(skillDir, templates, generalFiles);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
