import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  copyFile,
  rm,
  access,
} from "node:fs/promises";
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

interface SourceFileInfo {
  source: string;
  path: string;
}

interface SkillConfig {
  sources?: string[];
}

interface SkillInfo {
  name: string;
  description: string;
  fileName: string;
}

interface RegistryTopic {
  slug: string;
  name: string;
  description: string;
  paths: Record<Language, string>;
}

interface RegistryGeneralFile {
  slug: string;
  name: string;
  description: string;
  path: string;
}

interface RegistrySkill {
  name: string;
  description: string;
  path: string;
  topics: RegistryTopic[];
  general: RegistryGeneralFile[];
}

interface RegistryFile {
  version: number;
  skills: RegistrySkill[];
}

function transformSharedSnippetsForSkill(
  snippets: Map<string, string>,
  skillDir: string,
  templateSource: string,
  language: Language
): Map<string, string> {
  if (skillDir !== "chroma-cloud" || templateSource !== "chroma-shared") {
    return snippets;
  }

  const transformedSnippets = new Map<string, string>();

  for (const [name, code] of snippets) {
    transformedSnippets.set(name, transformSharedClientCode(code, language));
  }

  return transformedSnippets;
}

function transformSharedClientCode(code: string, language: Language): string {
  if (language === "typescript") {
    return code
      .replace(/\bChromaClient\b/g, "CloudClient")
      .replace(/new CloudClient\(\)/g, "new CloudClient({})");
  }

  return code.replace(
    /chromadb\.HttpClient\(\s*host="localhost",\s*port=8000\s*\)/g,
    "chromadb.CloudClient()"
  );
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
  const skillDirs: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillJsonPath = join(SRC_DIR, entry.name, "skill.json");
    const skillMdPath = join(SRC_DIR, entry.name, "SKILL.md");

    if ((await fileExists(skillJsonPath)) || (await fileExists(skillMdPath))) {
      skillDirs.push(entry.name);
    }
  }

  return skillDirs.sort();
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readSkillConfig(skillDir: string): Promise<SkillConfig> {
  const configPath = join(SRC_DIR, skillDir, "skill.json");
  if (!(await fileExists(configPath))) {
    return {};
  }

  return JSON.parse(await readFile(configPath, "utf-8")) as SkillConfig;
}

async function getSkillSources(skillDir: string): Promise<string[]> {
  const config = await readSkillConfig(skillDir);
  return config.sources ?? [skillDir];
}

async function getSourceFiles(
  sources: string[],
  kind: "templates" | "general"
): Promise<Map<string, SourceFileInfo>> {
  const files = new Map<string, SourceFileInfo>();

  for (const source of sources) {
    const dir = join(SRC_DIR, source, kind);
    try {
      const entries = await readdir(dir);
      for (const entry of entries) {
        if (entry.endsWith(".md")) {
          files.set(entry, {
            source,
            path: join(dir, entry),
          });
        }
      }
    } catch {
      // Source does not have this directory.
    }
  }

  return files;
}

async function loadSnippets(
  sources: string[],
  templateSource: string,
  language: Language,
  templateName: string
): Promise<Map<string, string>> {
  const ext = LANG_EXTENSIONS[language];
  const fileName = templateName.replace(".md", `.${ext}`);
  const candidateSources = [
    templateSource,
    ...sources.filter((source) => source !== templateSource).reverse(),
  ];

  for (const source of candidateSources) {
    const codeFile = join(SRC_DIR, source, "code", language, fileName);
    if (await fileExists(codeFile)) {
      const content = await readFile(codeFile, "utf-8");
      return parseSnippets(content);
    }
  }

  console.warn(`Warning: Code file not found for ${language}: ${fileName}`);
  return new Map();
}

async function buildSkill(skillDir: string): Promise<TemplateInfo[]> {
  const sources = await getSkillSources(skillDir);
  const templates = await getSourceFiles(sources, "templates");
  const templateInfos: TemplateInfo[] = [];

  for (const [templateFile, templateInfo] of templates) {
    const template = await readFile(templateInfo.path, "utf-8");
    const topicName = templateFile.replace(".md", "");

    // Parse frontmatter for template info
    const { name, description } = parseFrontmatter(template);
    templateInfos.push({ name, description, fileName: topicName });

    for (const language of LANGUAGES) {
      const snippets = transformSharedSnippetsForSkill(
        await loadSnippets(
          sources,
          templateInfo.source,
          language,
          templateFile
        ),
        skillDir,
        templateInfo.source,
        language
      );
      const output = replaceCodePlaceholders(
        template,
        snippets,
        language,
        templateInfo.path
      );

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
  const outputDir = join(OUTPUT_DIR, skillDir);
  const generalFiles: GeneralFileInfo[] = [];
  const sources = await getSkillSources(skillDir);
  const generalMarkdownFiles = await getSourceFiles(sources, "general");

  await mkdir(outputDir, { recursive: true });

  for (const [mdFile, sourceFile] of generalMarkdownFiles) {
    const destPath = join(outputDir, mdFile);

    const content = await readFile(sourceFile.path, "utf-8");
    const { name, description } = parseFrontmatter(content);
    generalFiles.push({ name, description, fileName: mdFile });

    await copyFile(sourceFile.path, destPath);
    console.log(`Copied: ${destPath}`);
  }

  return generalFiles;
}

async function readSkillInfo(skillDir: string): Promise<SkillInfo> {
  const skillPath = join(SRC_DIR, skillDir, "SKILL.md");
  const content = await readFile(skillPath, "utf-8");
  const { name, description } = parseFrontmatter(content);

  return {
    name: name || skillDir,
    description,
    fileName: skillDir,
  };
}

function buildRegistrySkill(
  skill: SkillInfo,
  templates: TemplateInfo[],
  generalFiles: GeneralFileInfo[]
): RegistrySkill {
  const sortedTemplates = [...templates].sort((a, b) => a.fileName.localeCompare(b.fileName));
  const sortedGeneralFiles = [...generalFiles].sort((a, b) =>
    a.fileName.localeCompare(b.fileName)
  );

  return {
    name: skill.name,
    description: skill.description,
    path: `${skill.fileName}/SKILL.md`,
    topics: sortedTemplates.map((template) => ({
      slug: template.fileName,
      name: template.name,
      description: template.description,
      paths: {
        typescript: `${skill.fileName}/${template.fileName}/typescript.md`,
        python: `${skill.fileName}/${template.fileName}/python.md`,
      },
    })),
    general: sortedGeneralFiles.map((file) => ({
      slug: file.fileName.replace(".md", ""),
      name: file.name,
      description: file.description,
      path: `${skill.fileName}/${file.fileName}`,
    })),
  };
}

async function writeRegistry(registrySkills: RegistrySkill[]): Promise<void> {
  const registry: RegistryFile = {
    version: 1,
    skills: registrySkills.sort((a, b) => a.path.localeCompare(b.path)),
  };
  const registryPath = join(OUTPUT_DIR, "registry.json");

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(registryPath, JSON.stringify(registry, null, 2) + "\n", "utf-8");
  console.log(`Generated: ${registryPath}`);
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
  const registrySkills: RegistrySkill[] = [];
  const existingOutputEntries = await readdir(OUTPUT_DIR, { withFileTypes: true }).catch(() => []);

  for (const entry of existingOutputEntries) {
    if (entry.isDirectory() && !skillDirs.includes(entry.name)) {
      const outputPath = join(OUTPUT_DIR, entry.name);
      await rm(outputPath, { recursive: true, force: true });
      console.log(`Removed stale output: ${outputPath}`);
    }
  }

  const registryPath = join(OUTPUT_DIR, "registry.json");
  await rm(registryPath, { force: true });

  for (const skillDir of skillDirs) {
    const outputPath = join(OUTPUT_DIR, skillDir);
    await rm(outputPath, { recursive: true, force: true });
    const skillInfo = await readSkillInfo(skillDir);
    const templates = await buildSkill(skillDir);
    const generalFiles = await copyGeneralMarkdownFiles(skillDir);
    await copySkillMd(skillDir, templates, generalFiles);
    registrySkills.push(buildRegistrySkill(skillInfo, templates, generalFiles));
  }

  await writeRegistry(registrySkills);

  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
