import Link from 'next/link';
import styles from './header.module.scss';
import commonStyles from '../../styles/common.module.scss';

export default function Header(): JSX.Element {
  return (
    <>
      <Link href="/">
        <header className={styles.headerContainer}>
          <div
            className={`${styles.headerContent} ${commonStyles.maxWidth1120}`}
          >
            <img src="/images/Logo.svg" alt="logo" />
          </div>
        </header>
      </Link>
    </>
  );
}
