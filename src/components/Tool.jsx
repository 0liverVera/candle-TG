import { useState, useEffect, useRef } from 'react'
import styles from './Tool.module.css'

const STEPS = [
  'Fetching token data...',
  'Token data fetched',
  'Creating Telegram group...',
  'Telegram group created',
  'Configuring verification gate...',
  'Safeguard gate active',
  'Installing mod bots...',
  'Mod bots installed',
  'Writing welcome message...',
  'Welcome message set',
  'Activating engagement network...',
  'Engagement network ready',
]

function timestamp() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false })
}

export default function Tool() {
  const [ca, setCa]         = useState('')
  const [chain, setChain]   = useState('Solana')
  const [gate, setGate]     = useState('Safeguard')
  const [log, setLog]       = useState([])
  const [running, setRunning] = useState(false)
  const [done, setDone]     = useState(false)
  const [link, setLink]     = useState('')
  const logRef              = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  function addLog(msg, type = 'info') {
    setLog(prev => [...prev, { msg, type, ts: timestamp() }])
  }

  async function handleBuild(e) {
    e.preventDefault()
    if (!ca.trim() || running) return
    setLog([])
    setDone(false)
    setLink('')
    setRunning(true)

    const delay = ms => new Promise(r => setTimeout(r, ms))

    addLog(`Starting build for ${ca.slice(0, 8)}...${ca.slice(-6)}`, 'muted')
    await delay(600)

    for (let i = 0; i < STEPS.length; i++) {
      const isResult = i % 2 === 1
      await delay(isResult ? 700 : 400)
      addLog(STEPS[i], isResult ? 'done' : 'pending')
    }

    await delay(400)
    const fakeLink = 'https://t.me/candletg_' + ca.slice(-6).toLowerCase()
    setLink(fakeLink)
    addLog('Group ready — invite link generated.', 'success')
    setRunning(false)
    setDone(true)
  }

  function handleReset() {
    setCa('')
    setLog([])
    setDone(false)
    setLink('')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.cardHeader}>
          <span className={styles.cardLabel}>Group Builder</span>
          {running && <span className={styles.pill}><span className={styles.dot} />running</span>}
          {done    && <span className={styles.pillDone}>complete</span>}
        </div>

        {/* Input area */}
        <div className={styles.body}>
          <form onSubmit={handleBuild} className={styles.form}>
            <input
              className={styles.caInput}
              type="text"
              placeholder="Contract address"
              value={ca}
              onChange={e => setCa(e.target.value)}
              disabled={running}
              spellCheck={false}
              autoComplete="off"
            />
            <div className={styles.row}>
              <select
                className={styles.select}
                value={chain}
                onChange={e => setChain(e.target.value)}
                disabled={running}
              >
                <option>Solana</option>
                <option>Ethereum</option>
                <option>Base</option>
              </select>
              <select
                className={styles.select}
                value={gate}
                onChange={e => setGate(e.target.value)}
                disabled={running}
              >
                <option>Safeguard</option>
                <option>Candle Guard</option>
              </select>
              {!done ? (
                <button
                  className={styles.buildBtn}
                  type="submit"
                  disabled={!ca.trim() || running}
                >
                  {running ? 'Building…' : 'Build group'}
                </button>
              ) : (
                <button
                  className={styles.resetBtn}
                  type="button"
                  onClick={handleReset}
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className={styles.logWrap}>
            <div className={styles.logInner} ref={logRef}>
              {log.map((entry, i) => (
                <div key={i} className={`${styles.logLine} ${styles[entry.type]}`}>
                  <span className={styles.ts}>{entry.ts}</span>
                  <span className={styles.logIcon}>
                    {entry.type === 'done'    ? '✓' :
                     entry.type === 'success' ? '✓' :
                     entry.type === 'pending' ? '·' : ' '}
                  </span>
                  <span className={styles.logMsg}>{entry.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {done && link && (
          <div className={styles.result}>
            <span className={styles.resultLabel}>Invite link</span>
            <div className={styles.resultRow}>
              <span className={styles.resultLink}>{link}</span>
              <button
                className={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(link)}
              >
                Copy
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
