import styles from './HowItWorks.module.css'

const steps = [
  {
    n: '01',
    title: 'Paste your contract address',
    desc: 'Drop your CA into CandleTG. We fetch your token name, image, ticker, and all relevant info automatically.',
  },
  {
    n: '02',
    title: 'We build everything',
    desc: 'Your Telegram group is created with the right name, description, and profile picture. Safeguard gate, mod bots, and welcome messages are configured instantly.',
  },
  {
    n: '03',
    title: 'Share and go live',
    desc: 'You get your invite link. Share it. Your community is live, verified, moderated, and looks active from day one.',
  },
]

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>How it works</p>
          <h2 className={styles.title}>Three steps.<br />That's it.</h2>
        </div>
        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div key={s.n} className={styles.step}>
              <div className={styles.left}>
                <span className={styles.num}>{s.n}</span>
                {i < steps.length - 1 && <div className={styles.line} />}
              </div>
              <div className={styles.content}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
