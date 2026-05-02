import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.logo}>🕯 Candle<b>TG</b></div>
        <div className={styles.right}>
          <a href="#features" className={styles.link}>Features</a>
          <a href="#launch" className={styles.btn}>Launch App</a>
        </div>
      </div>
    </nav>
  )
}
