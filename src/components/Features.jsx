import styles from './Features.module.css'

const features = [
  {
    icon: '🔐',
    title: 'Auto Verification Gate',
    desc: 'Safeguard integration built in. Every new member gets verified before they can speak — zero bots, zero spam.',
  },
  {
    icon: '👋',
    title: 'Smart Welcome Messages',
    desc: 'Custom welcome messages pulled from your token data. Name, ticker, CA, and links — all pre-filled automatically.',
  },
  {
    icon: '🤖',
    title: 'Mod Bot Setup',
    desc: 'Moderation bots are added and configured instantly. Anti-spam, anti-raid, and pinned announcements — ready to go.',
  },
  {
    icon: '🔥',
    title: 'Bot Engagement Network',
    desc: 'A network of bots that behave like real community members. Different personalities, natural sleep schedules — your group always feels alive.',
  },
  {
    icon: '🪙',
    title: 'Token-Aware Setup',
    desc: 'Reads your CA and fills in token name, logo, supply, and links automatically. No copy-pasting anything.',
  },
  {
    icon: '⚡',
    title: 'Under 60 Seconds',
    desc: 'From contract address to fully live Telegram group with everything configured — in under a minute.',
  },
]

export default function Features() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.label}>Features</p>
          <h2 className={styles.title}>Everything your group needs,<br />set up automatically.</h2>
          <p className={styles.sub}>No manual work. No copy-pasting links. No configuring bots one by one.</p>
        </div>
        <div className={styles.grid}>
          {features.map(f => (
            <div key={f.title} className={styles.card}>
              <div className={styles.icon}>{f.icon}</div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
