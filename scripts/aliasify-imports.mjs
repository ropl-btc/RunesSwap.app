#!/usr/bin/env node
/*
  Rewrites relative import paths (./ or ../) in files under src/ to use the '@/' alias.
  - Only rewrites imports that resolve to within the src directory
  - Handles: ES imports, re-exports, side-effect imports, dynamic imports, and require()
*/
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');

/**
 * Recursively list files under a directory
 */
function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.next')) continue; // skip build output if any nested
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function toAliasPath(fromFile, relImport) {
  try {
    // Normalize but do not attempt to resolve extensions/index files — preserve original semantics
    const absPath = path.normalize(
      path.resolve(path.dirname(fromFile), relImport),
    );
    const relToSrc = path.relative(srcRoot, absPath).split(path.sep).join('/');
    if (relToSrc.startsWith('..')) return null; // outside src — skip
    // Remove leading './' or '/' from relToSrc if present
    const normalized = relToSrc.replace(/^\.\//, '').replace(/^\/+/, '');
    return `@/${normalized}`;
  } catch (e) {
    return null;
  }
}

/**
 * Replace import-like occurrences in content using a replacer fn
 */
function rewriteImports(filePath, content) {
  let changed = false;

  const replacers = [
    // import ... from './x'
    {
      re: /(import|export)\s+[^;]*?\s+from\s+(["'])(\.[^"']*)(\2)/g,
      fn: (m, _kw, quote, rel, q2) => {
        const alias = rel.startsWith('.') ? toAliasPath(filePath, rel) : null;
        if (!alias) return m;
        changed = true;
        return m.replace(rel, alias);
      },
    },
    // side-effect imports: import './x'
    {
      re: /(^|\s)import\s+(["'])(\.[^"']*)(\2)/g,
      fn: (m, prefix, quote, rel, q2) => {
        const alias = rel.startsWith('.') ? toAliasPath(filePath, rel) : null;
        if (!alias) return m;
        changed = true;
        return `${prefix}import ${quote}${alias}${quote}`;
      },
    },
    // dynamic import('./x')
    {
      re: /import\(\s*(["'])(\.[^"']*)(\1)\s*\)/g,
      fn: (m, quote, rel, q2) => {
        const alias = rel.startsWith('.') ? toAliasPath(filePath, rel) : null;
        if (!alias) return m;
        changed = true;
        return `import(${quote}${alias}${quote})`;
      },
    },
    // require('./x')
    {
      re: /require\(\s*(["'])(\.[^"']*)(\1)\s*\)/g,
      fn: (m, quote, rel, q2) => {
        const alias = rel.startsWith('.') ? toAliasPath(filePath, rel) : null;
        if (!alias) return m;
        changed = true;
        return `require(${quote}${alias}${quote})`;
      },
    },
  ];

  let updated = content;
  for (const { re, fn } of replacers) {
    updated = updated.replace(re, fn);
  }

  return { changed, updated };
}

const exts = new Set(['.ts', '.tsx', '.js', '.jsx']);
const files = listFiles(srcRoot).filter((f) => exts.has(path.extname(f)));

const modified = [];

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { changed, updated } = rewriteImports(file, original);
  if (changed) {
    fs.writeFileSync(file, updated, 'utf8');
    modified.push(path.relative(repoRoot, file));
  }
}

if (modified.length === 0) {
  console.log('No relative imports found to rewrite.');
} else {
  console.log(`Rewrote imports in ${modified.length} file(s):`);
  for (const f of modified) console.log(` - ${f}`);
}
