import { useState } from 'react'
import styles from './Tool.module.css'

const STEPS = [
  { id: 'token',   label: 'Token data fetched',       desc: 'Name, ticker, logo, supply' },
  { id: 'group',   label: 'Telegram group created',   desc: 'Name, description, profile picture set' },
  { id: 'gate',    label: 'Verification gate active', desc: 'Safeguard configured and live' },
  { id: 'bots',    label: 'Mod bots installed',       desc: 'Anti-spam, anti-raid, pinned announcements' },
  { id: 'welcome', label: 'Welcome message set',      desc: 'Auto-filled with token info and links' },
  { id: 'network', label: 'Engagement network ready', desc: 'Bot community active and live' },
]

export default function Tool() {
  const [ca, setCa] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done
  const [completedSteps, setCompletedSteps] = useState([])
  const [groupLink, setGroupLink] = useState('')

  function handleLaunch(e) {
    e.preventDefault()
    if (!ca.trim()) return
    setStatus('loading')
    setCompletedSteps([])
    setGroupLink('')

    STEPS.forEach((step, i) => {
      setTimeout(() => {
        setCompletedSteps(prev => [...prev, step.id])
        if (i === STEPS.length - 1) {
          setStatus('done')
          setGroupLink('https://t.me/example_group')
        }
      }, (i + 1) * 900)
    })
  }

  function handleReset() {
    setStatus('idle')
    setCa('')
    setCompletedSteps([])
    setGroupLink('')
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* Left panel — input */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Group Builder</span>
          </div>

          <form className={styles.form} onSubmit={handleLaunch}>
            <label className={styles.label}>Contract Address</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. 0x1234...abcd"
              value={ca}
              onChange={e => setCa(e.target.value)}
              disabled={status === 'loading'}
              spellCheck={false}
            />

            <div className={styles.options}>
              <div className={styles.option}>
                <span className={styles.optLabel}>Chain</span>
                <select className={styles.select} disabled={status === 'loading'}>
                  <option>Solana</option>
                  <option>Ethereum</option>
                  <option>Base</option>
                </select>
              </div>
              <div className={styles.option}>
                <span className={styles.optLabel}>Gate</span>
                <select className={styles.select} disabled={status === 'loading'}>
                  <option>Safeguard</option>
                  <option>Candle Guard</option>
                </select>
              </div>
            </div>

            {status === 'idle' && (
              <button className={styles.btn} type="submit" disabled={!ca.trim()}>
                Launch Group
              </button>
            )}
            {status === 'loading' && (
              <button className={styles.btnDisabled} type="button" disabled>
                Building...
              </button>
            )}
            {status === 'done' && (
              <button className={styles.btnReset} type="button" onClick={handleReset}>
                Build Another
              </button>
            )}
          </form>

          <div className={styles.divider} />

          <div className={styles.infoBlock}>
            <p className={styles.infoTitle}>What gets built</p>
            <ul className={styles.infoList}>
              <li>Telegram group with token name & logo</li>
              <li>Safeguard or Candle Guard verification</li>
              <li>Mod bots configured</li>
              <li>Custom welcome message</li>
              <li>Bot engagement network</li>
            </ul>
          </div>
        </div>

        {/* Right panel — status */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Build Status</span>
            {status === 'loading' && <span className={styles.statusLive}><span className={styles.dot} />RUNNING</span>}
            {status === 'done'    && <span className={styles.statusDone}>COMPLETE</span>}
            {status === 'idle'    && <span className={styles.statusIdle}>IDLE</span>}
          </div>

          <div className={styles.steps}>
            {STEPS.map(step => {
              const done = completedSteps.includes(step.id)
              const active = status === 'loading' && completedSteps.length === STEPS.indexOf(step)
              return (
                <div key={step.id} className={`${styles.step} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}>
                  <div className={styles.stepIcon}>
                    {done ? '✓' : active ? '·' : '○'}
                  </div>
                  <div className={styles.stepText}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepDesc}>{step.desc}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {status === 'done' && (
            <div className={styles.result}>
              <p className={styles.resultLabel}>Your group is live</p>
              <a className={styles.resultLink} href={groupLink} target="_blank" rel="noreferrer">
                {groupLink}
              </a>
              <button
                className={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(groupLink)}
              >
                Copy link
              </button>
            </div>
          )}

          {status === 'idle' && (
            <div className={styles.empty}>
              <p>Paste a contract address and hit Launch to build your group.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
