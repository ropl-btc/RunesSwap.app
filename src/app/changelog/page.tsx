import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '@/app/page.module.css';

function getCleanChangelog(raw: string): string {
  const lines = raw.split(/\r?\n/);

  // Find first version heading (e.g., "## [0.2.1] - 2025-08-23" or any H2)
  let startIdx = lines.findIndex((l) => l.trim().startsWith('## '));
  if (startIdx === -1) startIdx = 0;

  // Slice from first H2 to end
  const sliced = lines.slice(startIdx);

  // Filter out reference-style link definitions at the bottom like: [0.2.1]: https://...
  const filtered = sliced.filter(
    (l) => !/^\[[^\]]+\]:\s*https?:\/\//.test(l.trim()),
  );

  return filtered.join('\n').trim();
}

export default function ChangelogPage() {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  let fileContents = '';
  try {
    fileContents = fs.readFileSync(changelogPath, 'utf-8');
  } catch (err) {
    console.error('Error reading CHANGELOG.md:', err);
  }

  const content = getCleanChangelog(fileContents);

  return (
    <div className={styles.container}>
      <h1 className="heading">Changelog</h1>
      <div className={styles.docsContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
      <div className={styles.backToHome}>
        <Link href="/">Back to Home</Link>
      </div>
    </div>
  );
}
