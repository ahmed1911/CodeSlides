#!/usr/bin/env node
import { cac } from 'cac';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
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

// --- Main Build Logic ---
async function runBuild(root: string | undefined, out: string | undefined) {
  // 1. Path Setup
  const projectPath = path.resolve(root || '.');
  const outputDir = out ? path.resolve(out) : path.join(projectPath, 'presentation');

  console.log(chalk.dim('📁 Project:'), chalk.cyan(projectPath));
  console.log(chalk.dim('📂 Output: '), chalk.cyan(outputDir));
  console.log();

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    await fsp.mkdir(outputDir, { recursive: true });
  }

  // 2. Scan Directory
  const scanSpinner = ora('Scanning project structure...').start();
  const structure = scanDirectory(projectPath);

  if (!structure || Object.keys(structure).length === 0) {
    scanSpinner.fail(chalk.red('No files found'));
    throw new Error('No files found or all files were ignored.');
  }
  scanSpinner.succeed(chalk.green('Project structure scanned'));

  // 3. Content Management
  const contentPath = path.join(outputDir, CONFIG.FILES.CONTENT);
  const currentFiles = buildFilePathMap(structure);

  let content = loadContent(contentPath);
  const hasExistingContent = Object.keys(content).length > 0;

  if (hasExistingContent) {
    console.log(chalk.dim('  ℹ️  Loading existing content...'));
    content = await detectDeletedFiles(content, currentFiles);
  } else {
    console.log(chalk.dim('  ℹ️  Creating new content file...'));
  }

  // 4. Merge, Sort & Inject
  const processSpinner = ora('Processing slides...').start();
  let mergedStructure = mergeStructureWithContent(structure, content);
  mergedStructure = injectAndSort(mergedStructure, content);

  // Attach META to the structure for the builder to use
  if (content[CONFIG.META_KEY]) {
    (mergedStructure as any)[CONFIG.META_KEY] = content[CONFIG.META_KEY];
  }


  // 5. Update JSON Data
  const newContentFromStructure = extractContentFromStructure(mergedStructure);
  const finalContent: PresentationContent = { ...content };
  let newFilesCount = 0;

  for (const [key, value] of Object.entries(newContentFromStructure)) {
    if (!finalContent[key]) {
      finalContent[key] = value;
      newFilesCount++;
    }
  }

  if (newFilesCount > 0) {
    processSpinner.text = `Processing slides... (${newFilesCount} new files)`;
  }

  await fsp.writeFile(contentPath, JSON.stringify(finalContent, null, 2));
  processSpinner.succeed(chalk.green('Slides processed'));

  // 6. Generate HTML
  const htmlSpinner = ora('Generating HTML...').start();

  const templateDir = await findTemplateDir(__dirname);
  const meta = content[CONFIG.META_KEY] || {};
  const projectTitle = meta.projectTitle || CONFIG.DEFAULT_TITLE;

  const finalHtml = await generateHtml(mergedStructure, projectTitle, templateDir);

  const htmlPath = path.join(outputDir, CONFIG.FILES.HTML);
  await fsp.writeFile(htmlPath, finalHtml);
  htmlSpinner.succeed(chalk.green('HTML generated'));

  // 7. Final Output
  console.log();
  console.log(chalk.bold.green('✨ Build complete!'));
  console.log();
  console.log(chalk.dim('📄 Files created:'));
  console.log(chalk.dim('  •'), chalk.cyan(path.relative(process.cwd(), htmlPath)));
  console.log(chalk.dim('  •'), chalk.cyan(path.relative(process.cwd(), contentPath)));
  console.log();
  console.log(chalk.bold('📌 Next steps:'));
  console.log(chalk.dim('  1.'), `Open ${chalk.cyan(path.basename(htmlPath))} in your browser`);
  console.log(
    chalk.dim('  2.'),
    `Edit ${chalk.cyan(path.basename(contentPath))} to customize slides`
  );
  console.log(chalk.dim('  3.'), `Run ${chalk.cyan('codeslides')} again to update`);
  console.log();
}

// --- CLI Definition ---
const cli = cac('codeslides');
const VERSION = '2.0.0';

// Header
console.log();
console.log(chalk.bold.cyan('  ╔═══════════════════════════════════╗'));
console.log(
  chalk.bold.cyan('  ║') + chalk.bold('   🎬 CodeSlides Generator v2.0  ') + chalk.bold.cyan('║')
);
console.log(chalk.bold.cyan('  ╚═══════════════════════════════════╝'));
console.log();

cli
  .command('[root] [out]', 'Generate presentation from project')
  .example('codeslides .')
  .example('codeslides ./src')
  .example('codeslides ./src ./output')
  .action(async (root, out) => {
    try {
      await runBuild(root, out);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log();
      console.log(chalk.bold.red('❌ Error:'), chalk.red(message));
      console.log();
      process.exit(1);
    }
  });

cli.help();
cli.version(VERSION);
cli.parse();
