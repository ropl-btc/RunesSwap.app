#!/usr/bin/env node
/*
  Fixes alias imports that should include 'components/' prefix when targeting files under src/components.
  For each alias import '@/X', if it does not resolve under src/X but does resolve under src/components/X,
  rewrite it to '@/components/X'. Works for TS/JS/CSS and index-resolved modules.
*/
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');

const CODE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.json'];
const STYLE_EXTS = ['.css', '.scss', '.sass', '.module.css', '.module.scss'];
const ASSET_EXTS = ['.svg'];
const EXTS = [...CODE_EXTS, ...STYLE_EXTS, ...ASSET_EXTS];

function pathExistsCandidate(baseNoExt) {
  // exact match
  if (fs.existsSync(baseNoExt)) return true;
  // with extensions
  for (const ext of EXTS) {
    if (fs.existsSync(baseNoExt + ext)) return true;
  }
  // index files under directory
  for (const ext of EXTS) {
    if (fs.existsSync(path.join(baseNoExt, 'index' + ext))) return true;
  }
  return false;
}

function resolvesUnder(relativePathFromSrc) {
  return pathExistsCandidate(path.join(srcRoot, relativePathFromSrc));
}

function listFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

const files = listFiles(srcRoot).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));

let modifiedCount = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let changed = false;

  const updated = src.replace(/(["'])@\/(.*?)(\1)/g, (m, quote, p, q2) => {
    // p is path after '@/'
    // Skip if already includes 'components/'
    if (p.startsWith('components/')) return m;

    // Attempt resolution under src/p
    if (resolvesUnder(p)) return m; // correct already

    // Try under src/components/p
    if (resolvesUnder(path.posix.join('components', p))) {
      changed = true;
      return `${quote}@/components/${p}${quote}`;
    }

    return m; // leave untouched
  });

  if (changed) {
    fs.writeFileSync(file, updated, 'utf8');
    modifiedCount++;
    console.log(`Fixed aliases in: ${path.relative(repoRoot, file)}`);
  }
}

if (modifiedCount === 0) {
  console.log('No alias fixes needed.');
} else {
  console.log(`Updated ${modifiedCount} file(s).`);
}
