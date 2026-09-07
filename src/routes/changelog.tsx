import { createFileRoute, Link } from '@tanstack/react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '@/app/page.module.css';
import fileContents from '../../CHANGELOG.md?raw';

function getCleanChangelog(raw: string): string {
  const lines = raw.split(/\r?\n/);

  // Find first version heading (e.g., "## [0.2.1] - 2025-08-23" or any H2)
  let startIdx = lines.findIndex((l) => l.trim().startsWith('## '));
  if (startIdx === -1) startIdx = 0;

  // Slice from first H2 to end
  const sliced = lines.slice(startIdx);

  // Filter out reference-style link definitions at the bottom like: [0.2.1]: https://...
  const filtered = sliced.filter((l) => !/^\[[^\]]+\]:\s*https?:\/\//.test(l.trim()));

  return filtered.join('\n').trim();
}

function ChangelogPage() {
  const content = fileContents
    ? getCleanChangelog(fileContents)
    : 'No changelog is currently available.';

  return (
    <div className={styles.container}>
      <h1 className="heading">Changelog</h1>
      <div className={styles.docsContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
      <div className={styles.backToHome}>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/changelog')({
  component: ChangelogPage,
  head: () => ({ meta: [{ title: 'Changelog | RunesSwap.app' }] }),
});
