import { promises as fs } from 'fs';
import { constants as fsConstants } from 'fs';
import * as path from 'path';
import { ProjectStructure } from './types';

const PLACEHOLDERS = {
    CSS: '/* INJECT_CSS */',
    JS: '/* INJECT_JS */',
    STRUCTURE: '/* INJECT_STRUCTURE */',
    TITLE: '/* INJECT_TITLE */',
} as const;

export async function generateHtml(structure: ProjectStructure, projectTitle: string, templateDir: string): Promise<string> {
    try {
        // Run I/O operations in parallel
        const [indexHtml, styleCss, scriptJs] = await Promise.all([
            fs.readFile(path.join(templateDir, 'index.html'), 'utf-8'),
            fs.readFile(path.join(templateDir, 'dist/output.css'), 'utf-8'),
            fs.readFile(path.join(templateDir, 'dist/bundle.js'), 'utf-8')
        ]);

        const safeScriptJs = scriptJs.replace(/<\/?script/gi, '\\x3C\\/script');

        return indexHtml
            .replaceAll(PLACEHOLDERS.CSS, () => styleCss)
            .replaceAll(PLACEHOLDERS.JS, () => safeScriptJs)
            .replaceAll(PLACEHOLDERS.STRUCTURE, () => JSON.stringify(structure, null, 2))
            .replaceAll(PLACEHOLDERS.TITLE, () => projectTitle);

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to generate HTML: ${message}`);
    }
}

export async function findTemplateDir(scriptDir: string): Promise<string> {
    const searchPaths = [
        path.resolve(scriptDir, '../templates'),
        path.resolve(scriptDir, 'templates'),
        path.join(process.cwd(), 'generator-ts', 'templates')
    ];

    for (const p of searchPaths) {
        try {
            await fs.access(path.join(p, 'index.html'), fsConstants.R_OK);
            return p;
        } catch {
            continue;
        }
    }
    
    throw new Error(`Template directory not found. Searched in:\n- ${searchPaths.join('\n- ')}`);
}