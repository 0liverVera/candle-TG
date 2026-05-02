import styles from './Features.module.css'

const features = [
  { icon: '🔐', title: 'Verification Gate',    desc: 'Safeguard built in — no bots, no spam from day one.' },
  { icon: '🤖', title: 'Mod Bots Ready',        desc: 'Anti-spam, anti-raid, pinned messages — configured instantly.' },
  { icon: '👋', title: 'Smart Welcome',          desc: 'Token name, CA, and links auto-filled in the welcome message.' },
  { icon: '🔥', title: 'Active Community',       desc: 'A bot network that makes your group feel alive around the clock.' },
]

export default function Features() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.inner}>
        <p className={styles.label}>What you get</p>
        <h2 className={styles.title}>Everything set up. Nothing to configure.</h2>
        <div className={styles.grid}>
          {features.map(f => (
            <div key={f.title} className={styles.card}>
              <span className={styles.icon}>{f.icon}</span>
              <div>
                <p className={styles.cardTitle}>{f.title}</p>
                <p className={styles.cardDesc}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
