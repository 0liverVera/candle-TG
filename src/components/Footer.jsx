import styles from './Footer.module.css'

export default function Footer() {
  return (
    <>
      <section className={styles.cta}>
        <div className={styles.glow} />
        <div className={styles.inner}>
          <h2 className={styles.title}>Ready to launch?</h2>
          <p className={styles.sub}>Paste your CA. Your group is live in under 60 seconds.</p>
          <form className={styles.form} onSubmit={e => e.preventDefault()}>
            <input className={styles.input} type="text" placeholder="Paste contract address..." spellCheck={false} />
            <button className={styles.btn} type="submit">Build my group →</button>
          </form>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.inner2}>
          <span className={styles.logo}>🕯 Candle<b>TG</b></span>
          <span className={styles.copy}>© 2025 CandleTG</span>
        </div>
      </footer>
    </>
  )
}
