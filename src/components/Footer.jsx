import styles from './Footer.module.css'

export default function Footer() {
  return (
    <>
      <section className={styles.cta}>
        <div className={styles.glow} />
        <div className={styles.inner}>
          <h2 className={styles.title}>Ready to launch?</h2>
          <p className={styles.sub}>Paste your CA and have a live, verified Telegram community in under 60 seconds.</p>
          <form className={styles.form} onSubmit={e => e.preventDefault()}>
            <input
              className={styles.input}
              type="text"
              placeholder="Paste contract address (CA)..."
              spellCheck={false}
            />
            <button className={styles.btn} type="submit">Launch Group →</button>
          </form>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.logo}>
            <span>🕯</span>
            <span>Candle<b>TG</b></span>
          </div>
          <p className={styles.copy}>© 2025 CandleTG. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
