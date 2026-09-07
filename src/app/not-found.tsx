import { Link } from '@tanstack/react-router';

import styles from '@/app/page.module.css';

/**
 * App-level 404 fallback.
 */
export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className="heading">Page Not Found</h1>
      <p>The page you requested does not exist.</p>
      <div className={styles.backToHome}>
        <Link to="/swap">Go to Swap</Link>
      </div>
    </div>
  );
}
