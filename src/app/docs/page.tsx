import fs from 'fs';
import Link from 'next/link';
import path from 'path';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import styles from '@/app/page.module.css';

/**
 * Render a documentation page that displays the project's README.md as GitHub-flavored Markdown and provides a link back to the home page.
 *
 * This component reads `README.md` from the repository root (process.cwd()). If reading the file fails, an error is logged and the content area is rendered empty.
 *
 * @returns The JSX element for the documentation page containing the rendered Markdown and a "Back to Home" link.
 */
export default function DocsPage() {
  const readmePath = path.join(process.cwd(), 'README.md');
  let fileContents = '';
  try {
    fileContents = fs.readFileSync(readmePath, 'utf-8');
  } catch (err) {
    console.error('Error reading README.md:', err);
  }

  return (
    <div className={styles.container}>
      <h1 className="heading">Documentation</h1>
      <div className={styles.docsContent}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {fileContents}
        </ReactMarkdown>
      </div>
      <div className={styles.backToHome}>
        <Link href="/">Back to Home</Link>
      </div>
    </div>
  );
}