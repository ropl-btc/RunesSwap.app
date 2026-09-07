import { createFileRoute, Link } from '@tanstack/react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '@/app/page.module.css';
import fileContents from '../../README.md?raw';

function DocsPage() {
  return (
    <div className={styles.container}>
      <h1 className="heading">Documentation</h1>
      <div className={styles.docsContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContents}</ReactMarkdown>
      </div>
      <div className={styles.backToHome}>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/docs')({
  component: DocsPage,
  head: () => ({ meta: [{ title: 'Documentation | RunesSwap.app' }] }),
});
