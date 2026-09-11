import { useMemo, useState } from 'react'
import './App.css'

const TIERS = [
  { key: 'first', label: '1등', className: 'first' },
  { key: 'second', label: '2등', className: 'second' },
  { key: 'third', label: '3등', className: 'third' },
]

const DEFAULTS = {
  first: 2,
  second: 20,
  third: 100,
}

function parseCount(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

function drawPrize(remaining) {
  const total = remaining.first + remaining.second + remaining.third
  if (total <= 0) return null

  let roll = Math.random() * total

  for (const tier of TIERS) {
    const count = remaining[tier.key]
    if (roll < count) return tier.key
    roll -= count
  }

  return TIERS[TIERS.length - 1].key
}

function formatPercent(part, total) {
  if (total <= 0) return '0%'
  return `${((part / total) * 100).toFixed(2)}%`
}

function App() {
  const [config, setConfig] = useState(DEFAULTS)
  const [remaining, setRemaining] = useState(DEFAULTS)
  const [history, setHistory] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [started, setStarted] = useState(false)

  const totalRemaining = remaining.first + remaining.second + remaining.third
  const totalConfigured = config.first + config.second + config.third
  const finished = started && totalRemaining === 0

  const probabilities = useMemo(
    () =>
      TIERS.map((tier) => ({
        ...tier,
        count: remaining[tier.key],
        percent: formatPercent(remaining[tier.key], totalRemaining),
        width: totalRemaining > 0 ? (remaining[tier.key] / totalRemaining) * 100 : 0,
      })),
    [remaining, totalRemaining],
  )

  const updateConfig = (key, value) => {
    if (started) return
    const next = { ...config, [key]: parseCount(value) }
    setConfig(next)
    setRemaining(next)
  }

  const handleDraw = () => {
    if (spinning || totalRemaining <= 0) return

    if (!started) setStarted(true)

    setSpinning(true)
    setLastResult(null)

    window.setTimeout(() => {
      const prize = drawPrize(remaining)
      if (!prize) {
        setSpinning(false)
        return
      }

      setRemaining((prev) => ({
        ...prev,
        [prize]: prev[prize] - 1,
      }))
      setLastResult(prize)
      setHistory((prev) => [
        {
          id: `${Date.now()}-${prev.length}`,
          prize,
          order: prev.length + 1,
        },
        ...prev,
      ])
      setSpinning(false)
    }, 850)
  }

  const handleReset = () => {
    setRemaining(config)
    setHistory([])
    setLastResult(null)
    setSpinning(false)
    setStarted(false)
  }

  const resultTier = TIERS.find((tier) => tier.key === lastResult)

  return (
    <div className="app">
      <header className="brand">
        <h1>뽑기</h1>
        <p>남은 등수 인원 ÷ 전체 남은 인원으로 확률이 정해집니다</p>
      </header>

      <section className="panel">
        <h2>인원 설정</h2>
        <div className="settings">
          {TIERS.map((tier) => (
            <div className="field" key={tier.key}>
              <label htmlFor={tier.key}>{tier.label}</label>
              <input
                id={tier.key}
                type="number"
                min="0"
                step="1"
                value={config[tier.key]}
                disabled={started}
                onChange={(e) => updateConfig(tier.key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <p className="hint">
          전체 {totalConfigured}명 · 뽑기를 시작하면 인원 설정은 잠기고, 초기화 후 다시 변경할 수
          있습니다.
        </p>
      </section>

      <div className="stage">
        <section className="panel draw-panel">
          <div
            className={[
              'result-ball',
              spinning ? 'spinning' : '',
              resultTier ? `reveal ${resultTier.className}` : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div>
              <div className="result-label">
                {spinning ? '추첨 중' : resultTier ? resultTier.label : 'READY'}
              </div>
              <div className="result-sub">
                {finished
                  ? '모든 추첨이 끝났습니다'
                  : spinning
                    ? '잠시만요…'
                    : resultTier
                      ? `${history[0]?.order ?? 0}번째 결과`
                      : '버튼을 눌러 뽑으세요'}
              </div>
            </div>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleDraw}
              disabled={spinning || totalRemaining <= 0 || totalConfigured <= 0}
            >
              {finished ? '추첨 완료' : '뽑기'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleReset}>
              초기화
            </button>
          </div>
        </section>

        <section className="panel stats">
          <h2>현재 확률</h2>
          <div className="stat-list">
            {probabilities.map((tier) => (
              <div className="stat" key={tier.key}>
                <div className="stat-top">
                  <span className={`stat-name ${tier.className}`}>{tier.label}</span>
                  <span className="stat-meta">
                    남은 {tier.count}명 · {tier.percent}
                  </span>
                </div>
                <div className="bar" aria-hidden="true">
                  <span className={tier.className} style={{ width: `${tier.width}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="total">
            <span>남은 전체</span>
            <span>
              {totalRemaining} / {totalConfigured}
            </span>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>결과 기록</h2>
        {history.length === 0 ? (
          <p className="empty">아직 뽑은 결과가 없습니다.</p>
        ) : (
          <ul className="history-list">
            {history.map((item) => {
              const tier = TIERS.find((t) => t.key === item.prize)
              return (
                <li key={item.id}>
                  <span>{item.order}번째</span>
                  <span className={`badge ${tier.className}`}>{tier.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default App
