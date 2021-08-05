import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <>
      <Link href="/">
        <header className={styles.headerContainer}>
          <div className={styles.headerContent}>
            <img src="/images/Logo.svg" alt="logo" />
          </div>
        </header>
      </Link>
    </>
  );
}
