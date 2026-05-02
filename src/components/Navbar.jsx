import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🕯</span>
          <span>Candle<b>TG</b></span>
        </div>
        <div className={styles.live}>
          <span className={styles.dot} />
          LIVE
        </div>
      </div>
    </nav>
  )
}
