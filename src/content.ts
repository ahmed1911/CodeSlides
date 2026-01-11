import * as fs from 'fs';
import { ProjectStructure, PresentationContent, SlideContent } from './types';

const META_KEY = '__META__';

// --- Helper Functions ---

const getDefaultContent = (filename: string): SlideContent => ({
  title: filename,
  sections: [
    {
      type: 'text',
      title: 'Introduction',
      content: `File: **${filename}**\n\nAdd description here...`
    },
    {
      type: 'list',
      title: 'Key Points',
      items: ['Point 1', 'Point 2', 'Point 3'],
      listStyle: 'bullets'
    }
  ]
});

// --- Core Logic ---

export function loadContent(contentPath: string): PresentationContent {
  if (!fs.existsSync(contentPath)) return {};
  try {
    const rawData = fs.readFileSync(contentPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️  Could not read content file: ${message}`);
    return {};
  }
}

export function mergeStructureWithContent(
  structure: ProjectStructure,
  content: PresentationContent,
  currentPath = ''
): ProjectStructure {
  const result: ProjectStructure = {};

  for (const [key, item] of Object.entries(structure)) {
    const fullPath = currentPath ? `${currentPath}/${key}` : key;

    // Skip files with show: false
    const existingContent = content[fullPath];
    if (existingContent && existingContent.show === false) {
      continue;
    }

    if (item.type === 'folder' && item.children) {
      const mergedChildren = mergeStructureWithContent(item.children, content, fullPath);
      // Only add folder if it has visible children
      if (Object.keys(mergedChildren).length > 0) {
        result[key] = {
          type: 'folder',
          children: mergedChildren,
        };
      }
    } else if (item.type === 'file') {
      result[key] = {
        type: 'file',
        icon: item.icon,
        content: content[fullPath] || getDefaultContent(key),
      };
    }
  }

  return result;
}

export function extractContentFromStructure(
  structure: ProjectStructure,
  currentPath = '',
  acc: PresentationContent = {}
): PresentationContent {
  for (const [key, item] of Object.entries(structure)) {
    const fullPath = currentPath ? `${currentPath}/${key}` : key;

    if ((item.type === 'file' || item.type === 'slide') && item.content) {
      acc[fullPath] = item.content;
    } else if (item.type === 'folder' && item.children) {
      extractContentFromStructure(item.children, fullPath, acc);
    }
  }
  return acc;
}

export async function detectDeletedFiles(
  content: PresentationContent,
  currentFiles: { [key: string]: boolean }
): Promise<PresentationContent> {
  const contentPaths = Object.keys(content);
  const customSlides = contentPaths.filter((p) => !currentFiles[p] && p !== META_KEY);

  if (customSlides.length > 0) {
    console.log('\n✨ Custom/Virtual Slides detected (preserved from JSON):');
    customSlides.forEach((file) => console.log(`   - ${file}`));
  }

  return content;
}

function sortBasedOnContentOrder(
  levelStructure: ProjectStructure,
  content: PresentationContent,
  currentPath: string
): ProjectStructure {
  const sorted: ProjectStructure = {};
  const structureKeys = Object.keys(levelStructure);
  const contentPaths = Object.keys(content);

  const definedOrder: string[] = [];

  contentPaths.forEach((fullPath) => {
    if (fullPath === META_KEY) return;

    const prefix = currentPath ? currentPath + '/' : '';
    if (fullPath.startsWith(prefix)) {
      const relativePath = fullPath.slice(prefix.length);
      const rootPart = relativePath.split('/')[0];

      if (levelStructure[rootPart] && !definedOrder.includes(rootPart)) {
        definedOrder.push(rootPart);
      }
    }
  });

  const newItems = structureKeys.filter((k) => !definedOrder.includes(k));
  const finalOrder = [...definedOrder, ...newItems];

  finalOrder.forEach((key) => {
    const item = levelStructure[key];
    sorted[key] = item;

    if (item.type === 'folder' && item.children) {
      const nextPath = currentPath ? `${currentPath}/${key}` : key;
      sorted[key].children = sortBasedOnContentOrder(item.children!, content, nextPath);
    }
  });

  return sorted;
}

export function injectAndSort(
  structure: ProjectStructure,
  content: PresentationContent
): ProjectStructure {
  const workingStructure: ProjectStructure = JSON.parse(JSON.stringify(structure));

  Object.keys(content).forEach((pathKey) => {
    if (pathKey === META_KEY) return;

    // Skip hidden slides (show: false)
    const slideContent = content[pathKey];
    if (slideContent && slideContent.show === false) return;

    const parts = pathKey.split('/');
    let currentLevel = workingStructure;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;

      if (!currentLevel[part]) {
        if (isLast) {
          currentLevel[part] = { type: 'slide', content: content[pathKey] };
        } else {
          currentLevel[part] = { type: 'folder', children: {} };
        }
      }

      if (!isLast) {
        const node = currentLevel[part];
        if (node.type === 'folder') {
          node.children = node.children || {};
          currentLevel = node.children;
        }
      }
    });
  });

  return sortBasedOnContentOrder(workingStructure, content, '');
}
