import styles from './Topbar.module.css'

export default function Topbar() {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <span>🕯</span>
          <span>Candle<b>TG</b></span>
        </div>
        <div className={styles.center}>
          <span className={styles.tag}>Telegram Automation</span>
        </div>
        <div className={styles.right}>
          <span className={styles.live}><span className={styles.dot} />Live</span>
          <a href="https://t.me" className={styles.link} target="_blank" rel="noreferrer">Telegram</a>
          <a href="https://twitter.com" className={styles.link} target="_blank" rel="noreferrer">Twitter</a>
        </div>
      </div>
    </header>
  )
}
