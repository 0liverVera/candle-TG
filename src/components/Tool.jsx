import { useState, useEffect } from 'react'
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

const STATS = [
  { value: '< 60s',    label: 'Average build time' },
  { value: '3 Chains', label: 'Solana · Ethereum · Base' },
  { value: '6 Steps',  label: 'Fully automated setup' },
]

const SEED_ACTIVITY = [
  { ca: '7xKXtg2C...TZRuJosg', chain: 'Solana',   age: 2  },
  { ca: '0x4fa9...b83C',       chain: 'Ethereum', age: 7  },
  { ca: 'DxK9pQr2...mN1vWs',   chain: 'Solana',   age: 14 },
  { ca: '0x91bE...44aF',       chain: 'Base',     age: 23 },
  { ca: '9vR2sTkp...3pL7qH',   chain: 'Solana',   age: 38 },
]

function timeAgo(mins) {
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function Tool() {
  const [ca, setCa]             = useState('')
  const [username, setUsername] = useState('')
  const [chain, setChain]       = useState('Solana')
  const [running, setRunning]   = useState(false)
  const [done, setDone]         = useState(false)
  const [progress, setProgress] = useState(0)
  const [link, setLink]         = useState('')
  const [copied, setCopied]     = useState(false)
  const [activity, setActivity] = useState(SEED_ACTIVITY)
  const [totalBuilt, setTotalBuilt] = useState(1847)

  // Simulate new activity occasionally
  useEffect(() => {
    const chains = ['Solana', 'Ethereum', 'Base']
    const interval = setInterval(() => {
      const fake = {
        ca: `${Math.random().toString(36).slice(2,8).toUpperCase()}...${Math.random().toString(36).slice(2,6).toUpperCase()}`,
        chain: chains[Math.floor(Math.random() * chains.length)],
        age: 0,
      }
      setActivity(prev => [fake, ...prev].slice(0, 5))
      setTotalBuilt(n => n + 1)
    }, 18000)
    return () => clearInterval(interval)
  }, [])

  async function handleBuild(e) {
    e.preventDefault()
    if (!ca.trim() || !username.trim() || running) return
    setDone(false)
    setProgress(0)
    setLink('')
    setRunning(true)

    // Animate steps while real API runs
    let apiDone = false
    const animateSteps = async () => {
      for (let i = 1; i <= STEPS.length; i++) {
        await new Promise(r => setTimeout(r, 900 + Math.random() * 500))
        if (apiDone) { setProgress(STEPS.length); break }
        setProgress(i)
      }
    }
    const animPromise = animateSteps()

    try {
      const res  = await fetch('http://localhost:3001/build', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ca, chain, username }),
      })
      const data = await res.json()
      apiDone = true
      await animPromise
      setProgress(STEPS.length)

      if (data.inviteLink) {
        setLink(data.inviteLink)
        setTotalBuilt(n => n + 1)
        const newEntry = { ca: ca.slice(0,8) + '...' + ca.slice(-4), chain, age: 0 }
        setActivity(prev => [newEntry, ...prev].slice(0, 5))
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch {
      apiDone = true
      alert('Could not reach server — make sure the backend is running.')
    }

    setRunning(false)
    setDone(true)
  }

  function handleReset() {
    setCa(''); setUsername(''); setProgress(0); setDone(false); setLink(''); setCopied(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const chainColor = { Solana: '#9945ff', Ethereum: '#627eea', Base: '#0052ff' }

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.layout}>

        {/* ── LEFT ── */}
        <div className={styles.left}>
          <p className={styles.eyebrow}>CANDLETG — GROUP BUILDER</p>

          <h1 className={styles.headline}>
            Your token.<br />
            A real community.<br />
            Built in seconds.
          </h1>

          <p className={styles.body}>
            Paste your contract address. We handle verification, moderation,
            and engagement automatically. No configuration. No setup.
          </p>

          <div className={styles.stats}>
            {STATS.map((s, i) => (
              <div key={s.value}>
                {i > 0 && <div className={styles.statDivider} />}
                <div className={styles.statRow}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Live activity feed */}
          <div className={styles.feed}>
            <div className={styles.feedHeader}>
              <span className={styles.feedTitle}>Recent launches</span>
              <span className={styles.feedCount}>{totalBuilt.toLocaleString()} total</span>
            </div>
            <div className={styles.feedRows}>
              {activity.map((a, i) => (
                <div key={i} className={styles.feedRow}>
                  <span className={styles.feedDot} style={{ background: chainColor[a.chain] }} />
                  <span className={styles.feedCa}>{a.ca}</span>
                  <span className={styles.feedChain}>{a.chain}</span>
                  <span className={styles.feedAge}>{timeAgo(a.age)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div className={styles.colDivider} />

        {/* ── RIGHT — tool card ── */}
        <div className={styles.right}>
          <div className={styles.card}>

            <div className={styles.cardTop}>
              <div className={styles.logoRow}>
                <span className={styles.logoMark}>🕯</span>
                <span className={styles.logoText}>Candle<b>TG</b></span>
              </div>
              <div className={styles.liveChip}>
                <span className={styles.liveDot} />LIVE
              </div>
            </div>

            <p className={styles.subtitle}>
              <span className={styles.sepDot} />Automated
              <span className={styles.sepDot} />Instant
              <span className={styles.sepDot} />Live
            </p>

            <div className={styles.divider} />

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

              <label className={styles.fieldLabel} style={{ marginTop: 4 }}>Your Telegram Username</label>
              <input
                className={styles.caInput}
                type="text"
                placeholder="@yourusername"
                value={username}
                onChange={e => setUsername(e.target.value)}
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
                  >{c}</button>
                ))}
              </div>

              {!done ? (
                <button className={styles.buildBtn} onClick={handleBuild} disabled={!ca.trim() || !username.trim() || running}>
                  {running
                    ? <span className={styles.buildingRow}><span className={styles.spinner} />Building…</span>
                    : 'Build my group'}
                </button>
              ) : (
                <button className={styles.resetBtn} onClick={handleReset}>Start over</button>
              )}
            </div>

            <div className={styles.divider} />

            <div className={styles.checklist}>
              <span className={styles.fieldLabel}>Build Status</span>
              <div className={styles.steps}>
                {STEPS.map((step, i) => {
                  const completed = progress > i
                  const active    = running && progress === i
                  return (
                    <div key={step} className={`${styles.step} ${completed ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}>
                      <div className={styles.stepCircle}>
                        {completed && <span className={styles.check}>✓</span>}
                      </div>
                      <span className={styles.stepLabel}>{step}</span>
                    </div>
                  )
                })}
              </div>
            </div>

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
      </div>
    </div>
  )
}
