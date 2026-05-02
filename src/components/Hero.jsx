import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero} id="launch">
      <div className={styles.glow} />
      <div className={styles.inner}>
        <div className={styles.badge}>
          <span className={styles.dot} />
          Automated Telegram Community Builder
        </div>

        <h1 className={styles.headline}>
          Paste your CA.<br />
          <span className={styles.accent}>Your Telegram group</span><br />
          launches itself.
        </h1>

        <p className={styles.sub}>
          CandleTG reads your contract address, builds a fully verified Telegram group —
          with gate, welcome messages, mod bots, and an active community —
          in under 60 seconds.
        </p>

        <form className={styles.form} onSubmit={e => e.preventDefault()}>
          <input
            className={styles.input}
            type="text"
            placeholder="Paste contract address (CA)..."
            spellCheck={false}
          />
          <button className={styles.btn} type="submit">
            Launch Group →
          </button>
        </form>

        <p className={styles.hint}>Works on Ethereum, Solana, and Base</p>
      </div>
    </section>
  )
}
