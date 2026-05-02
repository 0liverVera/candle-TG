import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} />
      <div className={styles.inner}>

        <div className={styles.badge}>
          <span className={styles.dot} /> Automated · Instant · Live
        </div>

        <h1 className={styles.h1}>
          Your memecoin deserves<br />
          a <span className={styles.green}>real community</span>.
        </h1>

        <p className={styles.sub}>
          Paste your contract address. We build your Telegram group —
          verified, moderated, and active — in under 60 seconds.
        </p>

        <form className={styles.form} onSubmit={e => e.preventDefault()} id="launch">
          <input
            className={styles.input}
            type="text"
            placeholder="Paste contract address..."
            spellCheck={false}
          />
          <button className={styles.btn} type="submit">
            Build my group →
          </button>
        </form>

        <p className={styles.chains}>Solana · Ethereum · Base</p>

        <div className={styles.preview}>
          <div className={styles.previewBar}>
            <span className={styles.previewDot} />
            <span className={styles.previewDot} style={{background:'#333'}} />
            <span className={styles.previewDot} style={{background:'#333'}} />
            <span className={styles.previewTitle}>Build Status · LIVE</span>
          </div>
          <div className={styles.previewRows}>
            {[
              ['Token data fetched',       '✓', true],
              ['Telegram group created',   '✓', true],
              ['Safeguard gate active',    '✓', true],
              ['Mod bots installed',       '✓', true],
              ['Welcome message set',      '○', false],
              ['Engagement network ready', '○', false],
            ].map(([label, icon, done]) => (
              <div key={label} className={`${styles.previewRow} ${done ? styles.done : ''}`}>
                <span className={styles.previewIcon}>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
