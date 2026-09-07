#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MAX_LINES = 250;
const OVERSIZE_ALLOWLIST = new Set([
  'src/components/borrow/BorrowTab.tsx',
  'src/components/charts/PriceChart.tsx',
  'src/components/swap/SwapTab.tsx',
  'src/hooks/__tests__/useBorrowProcess.test.tsx',
  'src/hooks/__tests__/useWalletConnection.test.ts',
  'src/hooks/useSwapExecution.ts',
  'src/hooks/useSwapQuote.ts',
  'src/lib/api/__tests__/liquidium.test.ts',
  'src/lib/validationSchemas.ts',
  'src/sdk/liquidium/core/request.ts',
  'src/sdk/liquidium/services/BorrowerService.ts',
]);

const issues = [];

function listFiles() {
  const files = [];
  const directories = ['src'];

  while (directories.length > 0) {
    const directory = directories.pop();
    for (const entry of fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true })) {
      const filePath = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) directories.push(filePath);
      else if (/\.tsx?$/.test(entry.name)) files.push(filePath);
    }
  }

  return files.sort();
}

function checkForbiddenPatterns(filePath, content) {
  const checks = [
    {
      regex: /from\s+['"]@\/lib\/api['"]/,
      message: "Use direct API module imports instead of '@/lib/api' barrel imports.",
    },
    {
      regex: /from\s+['"]@\/components\/swap['"]/,
      message: "Use direct component imports instead of '@/components/swap' barrel imports.",
    },
    {
      regex: /tabChange/,
      message: 'Legacy tabChange event bus is forbidden. Use route navigation instead.',
    },
    {
      regex: /window\.history\.pushState/,
      message: 'Manual URL state syncing with pushState is forbidden for tab navigation.',
    },
  ];

  for (const check of checks) {
    if (check.regex.test(content)) {
      issues.push(`${filePath}: ${check.message}`);
    }
  }
}

function checkSize(filePath, content) {
  const lineCount = content.split('\n').length;
  if (lineCount <= MAX_LINES) return;
  if (OVERSIZE_ALLOWLIST.has(filePath)) return;
  if (content.includes('@architecture-waiver oversized')) return;
  issues.push(
    `${filePath}: ${lineCount} lines exceeds ${MAX_LINES}. Split file or add waiver comment.`,
  );
}

for (const filePath of listFiles()) {
  if (filePath === 'src/routeTree.gen.ts') continue;
  const absPath = path.join(ROOT, filePath);
  const content = fs.readFileSync(absPath, 'utf8');
  checkForbiddenPatterns(filePath, content);
  checkSize(filePath, content);
}

if (issues.length > 0) {
  console.error('Architecture lint failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log('Architecture lint passed.');
