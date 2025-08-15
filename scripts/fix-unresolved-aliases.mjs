#!/usr/bin/env node
/*
  General fixer: For alias imports like '@/x/y' that do not resolve under src/x/y,
  try prefixing each top-level directory under src (e.g., components, lib, hooks, utils, etc.).
  If exactly one candidate resolves, rewrite to that path.
*/
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');

const exts = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.css',
  '.scss',
  '.sass',
  '.module.css',
  '.module.scss',
];

function resolves(baseNoExt) {
  if (fs.existsSync(baseNoExt)) return true;
  for (const ext of exts) {
    if (fs.existsSync(baseNoExt + ext)) return true;
    if (fs.existsSync(path.join(baseNoExt, 'index' + ext))) return true;
  }
  return false;
}

const topLevelDirs = fs
  .readdirSync(srcRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

function listCodeFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listCodeFiles(full));
    else if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) out.push(full);
  }
  return out;
}

const files = listCodeFiles(srcRoot);
let changedFiles = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let changed = false;
  const updated = original.replace(/(["'])@\/(.*?)(\1)/g, (m, quote, p, q2) => {
    if (
      p.startsWith('components/') ||
      p.startsWith('lib/') ||
      p.startsWith('app/') ||
      p.startsWith('hooks/') ||
      p.startsWith('utils/') ||
      p.startsWith('types/') ||
      p.startsWith('context/') ||
      p.startsWith('store/')
    ) {
      return m; // likely fine
    }
    const targetBase = path.join(srcRoot, p);
    if (resolves(targetBase)) return m; // fine
    // try prefix each top-level dir
    const candidates = [];
    for (const dir of topLevelDirs) {
      const candidateBase = path.join(srcRoot, dir, p);
      if (resolves(candidateBase)) candidates.push(dir);
    }
    if (candidates.length === 1) {
      changed = true;
      return `${quote}@/${candidates[0]}/${p}${quote}`;
    }
    return m;
  });
  if (changed) {
    fs.writeFileSync(file, updated, 'utf8');
    changedFiles++;
    console.log(
      `Rewrote unresolved aliases in: ${path.relative(repoRoot, file)}`,
    );
  }
}

console.log(`Done. Updated ${changedFiles} file(s).`);
