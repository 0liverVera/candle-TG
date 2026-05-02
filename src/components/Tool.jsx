import { useState, useRef, useEffect } from 'react'
import styles from './Tool.module.css'

const CHAINS = ['Solana', 'Ethereum', 'Base']

const STEPS = [
  'Token data fetched',
  'Telegram group created',
  'Safeguard gate active',
  'Mod bots installed',
  'Welcome message set',
  'Engagement network ready',
]

export default function Tool() {
  const [ca, setCa]           = useState('')
  const [chain, setChain]     = useState('Solana')
  const [running, setRunning] = useState(false)
  const [done, setDone]       = useState(false)
  const [progress, setProgress] = useState(0) // how many steps completed
  const [link, setLink]       = useState('')
  const [copied, setCopied]   = useState(false)

  async function handleBuild(e) {
    e.preventDefault()
    if (!ca.trim() || running) return
    setDone(false)
    setProgress(0)
    setLink('')
    setRunning(true)

    for (let i = 1; i <= STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 750 + Math.random() * 400))
      setProgress(i)
    }

    setLink('https://t.me/candletg_' + ca.slice(-6).toLowerCase())
    setRunning(false)
    setDone(true)
  }

  function handleReset() {
    setCa('')
    setProgress(0)
    setDone(false)
    setLink('')
    setCopied(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.glow} />

      <div className={styles.card}>

        {/* ── Card header ── */}
        <div className={styles.cardTop}>
          <div className={styles.logoRow}>
            <span className={styles.logoMark}>🕯</span>
            <span className={styles.logoText}>Candle<b>TG</b></span>
          </div>
          <div className={styles.liveChip}>
            <span className={styles.liveDot} />
            LIVE
          </div>
        </div>

        <p className={styles.subtitle}>
          <span className={styles.sepDot} />Automated
          <span className={styles.sepDot} />Instant
          <span className={styles.sepDot} />Live
        </p>

        <div className={styles.divider} />

        {/* ── Input area ── */}
        <div className={styles.inputSection}>
          <label className={styles.fieldLabel}>Contract Address</label>
          <input
            className={styles.caInput}
            type="text"
            placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs"
            value={ca}
            onChange={e => setCa(e.target.value)}
            disabled={running}
            spellCheck={false}
            autoComplete="off"
          />

          <label className={styles.fieldLabel} style={{ marginTop: 4 }}>Chain</label>
          <div className={styles.pillRow}>
            {CHAINS.map(c => (
              <button
                key={c}
                type="button"
                className={`${styles.pill} ${chain === c ? styles.pillActive : ''}`}
                onClick={() => setChain(c)}
                disabled={running}
              >
                {c}
              </button>
            ))}
          </div>

          {!done ? (
            <button
              className={styles.buildBtn}
              onClick={handleBuild}
              disabled={!ca.trim() || running}
            >
              {running ? (
                <span className={styles.buildingRow}>
                  <span className={styles.spinner} />
                  Building…
                </span>
              ) : 'Build my group'}
            </button>
          ) : (
            <button className={styles.resetBtn} onClick={handleReset}>
              Start over
            </button>
          )}
        </div>

        <div className={styles.divider} />

        {/* ── Status checklist ── */}
        <div className={styles.checklist}>
          <span className={styles.fieldLabel}>Build Status</span>
          <div className={styles.steps}>
            {STEPS.map((step, i) => {
              const completed = progress > i
              const active    = running && progress === i
              return (
                <div
                  key={step}
                  className={`${styles.step} ${completed ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}
                >
                  <div className={styles.stepCircle}>
                    {completed && <span className={styles.check}>✓</span>}
                  </div>
                  <span className={styles.stepLabel}>{step}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Result ── */}
        {done && link && (
          <>
            <div className={styles.divider} />
            <div className={styles.result}>
              <span className={styles.fieldLabel}>Invite link</span>
              <div className={styles.resultRow}>
                <span className={styles.resultLink}>{link}</span>
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
