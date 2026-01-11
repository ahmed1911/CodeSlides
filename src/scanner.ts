import * as fs from 'fs';
import * as path from 'path';
import { ProjectStructure } from './types';

// --- Configuration ---

const IGNORE_EXACT = new Set([
    'node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage',
    '.cache', '.vscode', '.idea', '.DS_Store',
    'presentation-content.json', 'code-presentation.html',
    'presentation', 'presentation.zip',
    'generator-ts'
]);

const IGNORE_EXTENSIONS = [
    '.log', '.lock', '.map', '.d.ts'
];

const FILE_ICONS: Record<string, string> = {
    '.tsx': 'ri-reactjs-line',
    '.jsx': 'ri-reactjs-line',
    '.ts': 'ri-file-code-line',
    '.js': 'ri-javascript-line',
    '.svelte': 'ri-code-s-slash-line',
    '.vue': 'ri-vuejs-line',
    '.py': 'ri-file-code-line',
    '.java': 'ri-cup-line',
    '.php': 'ri-code-marker-line',
    '.html': 'ri-html5-line',
    '.css': 'ri-css3-line',
    '.scss': 'ri-css3-line',
    '.json': 'ri-braces-line',
    '.md': 'ri-markdown-line',
    '.yml': 'ri-settings-4-line',
    '.yaml': 'ri-settings-4-line',
    '.xml': 'ri-code-line',
    '.sql': 'ri-database-2-line',
    '.sh': 'ri-terminal-box-line',
    'default': 'ri-file-text-line'
} as const;

// --- Helpers ---

const shouldIgnore = (name: string): boolean => {
    if (IGNORE_EXACT.has(name)) return true;
    return IGNORE_EXTENSIONS.some(ext => name.endsWith(ext));
};

const getFileIcon = (filename: string): string => {
    const ext = path.extname(filename).toLowerCase();
    return FILE_ICONS[ext] || FILE_ICONS['default'];
};

// --- Core Logic ---

export function scanDirectory(
    dirPath: string, 
    maxDepth = 5, 
    currentDepth = 0
): ProjectStructure | null {
    if (currentDepth >= maxDepth) return null;

    const result: ProjectStructure = {};

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const name = entry.name;

            if (shouldIgnore(name)) continue;

            if (entry.isDirectory()) {
                const fullPath = path.join(dirPath, name);
                const children = scanDirectory(fullPath, maxDepth, currentDepth + 1);
                
                if (children && Object.keys(children).length > 0) {
                    result[name] = { 
                        type: 'folder', 
                        children 
                    };
                }
            } else if (entry.isFile()) {
                result[name] = { 
                    type: 'file', 
                    icon: getFileIcon(name) 
                };
            }
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️  Skipping directory "${dirPath}": ${message}`);
        return null;
    }

    return Object.keys(result).length > 0 ? result : null;
}

export function buildFilePathMap(
    structure: ProjectStructure, 
    currentPath = '', 
    map: { [key: string]: boolean } = {}
): { [key: string]: boolean } {
    
    for (const [key, item] of Object.entries(structure)) {
        const fullPath = currentPath ? `${currentPath}/${key}` : key;
        
        if (item.type === 'file') {
            map[fullPath] = true;
        } else if (item.type === 'folder' && item.children) {
            buildFilePathMap(item.children, fullPath, map);
        }
    }
    
    return map;
}