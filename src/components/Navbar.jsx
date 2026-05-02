import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span className={styles.flame}>🕯</span>
          <span>Candle<b>TG</b></span>
        </div>
        <div className={styles.links}>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </div>
        <a href="#launch" className={styles.cta}>Launch App</a>
      </div>
    </nav>
  )
}
