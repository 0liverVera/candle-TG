import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>
        <span className={styles.candle}>🕯</span>
        <span>Candle<b>TG</b></span>
      </div>
    </nav>
  )
}
