#!/usr/bin/env node
import { cac } from 'cac';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import { scanDirectory, buildFilePathMap } from './scanner';
import {
  loadContent,
  mergeStructureWithContent,
  detectDeletedFiles,
  extractContentFromStructure,
  injectAndSort,
} from './content';
import { generateHtml, findTemplateDir } from './builder';
import { PresentationContent } from './types';

// --- Configuration ---
const CONFIG = {
  FILES: {
    CONTENT: 'presentation-content.json',
    HTML: 'code-presentation.html',
  },
  META_KEY: '__META__',
  DEFAULT_TITLE: 'Project Explorer',
} as const;

// --- Logger Helper ---
const Log = {
  header: (version: string) =>
    console.log(`\n🚀 CodeSlides Generator v${version} (TS)\n====================================`),
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  step: (msg: string) => console.log(`\n👉 ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  file: (path: string, label = 'File') => console.log(`💾 ${label}: ${path}`),
};

// --- Main Build Logic ---
async function runBuild(root: string | undefined, out: string | undefined) {
  // 1. Path Setup
  const projectPath = path.resolve(root || '.');
  const outputDir = out ? path.resolve(out) : path.join(projectPath, 'presentation');

  console.log(`📁 Project: ${projectPath}`);
  console.log(`📂 Output:  ${outputDir}`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    await fsp.mkdir(outputDir, { recursive: true });
  }

  // 2. Scan Directory
  Log.step('Scanning project structure...');
  const structure = scanDirectory(projectPath);

  if (!structure || Object.keys(structure).length === 0) {
    throw new Error('No files found or all files were ignored.');
  }
  Log.success('Structure scanned');

  // 3. Content Management
  const contentPath = path.join(outputDir, CONFIG.FILES.CONTENT);
  const currentFiles = buildFilePathMap(structure);

  let content = loadContent(contentPath);
  const hasExistingContent = Object.keys(content).length > 0;

  if (hasExistingContent) {
    Log.info('Loading existing content and checking for deleted files...');
    content = await detectDeletedFiles(content, currentFiles);
  } else {
    Log.info('Creating new content file...');
  }

  // 4. Merge, Sort & Inject
  Log.step('Processing slides...');
  // We combine structure + content, then inject custom slides and sort results
  let mergedStructure = mergeStructureWithContent(structure, content);
  mergedStructure = injectAndSort(mergedStructure, content);

  // 5. Update JSON Data (Preserve user edits, add new files)
  const newContentFromStructure = extractContentFromStructure(mergedStructure);
  const finalContent: PresentationContent = { ...content };
  let newFilesCount = 0;

  for (const [key, value] of Object.entries(newContentFromStructure)) {
    if (!finalContent[key]) {
      finalContent[key] = value;
      newFilesCount++;
    }
  }

  if (newFilesCount > 0) Log.success(`${newFilesCount} new file(s) added to content.`);

  await fsp.writeFile(contentPath, JSON.stringify(finalContent, null, 2));
  Log.file(contentPath, 'Content Data');

  // 6. Generate HTML
  Log.step('Generating HTML...');

  const templateDir = await findTemplateDir(__dirname);
  const meta = content[CONFIG.META_KEY] || {};
  const projectTitle = meta.projectTitle || CONFIG.DEFAULT_TITLE;

  const finalHtml = await generateHtml(mergedStructure, projectTitle, templateDir);

  const htmlPath = path.join(outputDir, CONFIG.FILES.HTML);
  await fsp.writeFile(htmlPath, finalHtml);
  Log.file(htmlPath, 'Presentation');

  // 7. Final Output
  console.log('\n📌 Next Steps:');
  console.log(`   1. Open ${htmlPath} in your browser`);
  console.log(`   2. Edit ${contentPath} to add notes/slides`);
  console.log(`   3. Run 'codeslides' again to update`);
}

// --- CLI Definition ---
const cli = cac('codeslides');
const VERSION = '2.0.0';

cli
  .command('[root] [out]', 'Generate documentation from project root')
  .action(async (root, out) => {
    try {
      Log.header(VERSION);
      await runBuild(root, out);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Log.error(message);
      process.exit(1);
    }
  });

cli.help();
cli.version(VERSION);
cli.parse();
