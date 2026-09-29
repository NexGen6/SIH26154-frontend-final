import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../src/services/api'
import teamlogo from '../src/assets/teamlogo.png'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.post('/auth/user/login', { email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your email and password.')
    } finally { setLoading(false) }
  }

  return (
    <main className="login">
      <section className="login-l">
        <div className="brand">
          <div className="logo"><img src={teamlogo} alt="NexGen6" /></div>
          <div>
            <div className="wordmark">NEXGEN6</div>
            <div className="mono dim tagline">Omnichannel single-source transform platform</div>
          </div>
        </div>
        <div>
          <span className="tag">SIH-2026 // PS 154</span>
          <h1 style={{ marginTop: 20 }}>One source. Seven deliverables.</h1>
          <p className="lead">Turn a single advisory, directive or image into LinkedIn posts, X threads, policy notes, infographics, summaries, decks and video scripts, tuned to your audience, tone and language.</p>
        </div>
        <div className="mono dim">Authorised access only</div>
      </section>
      <section className="login-r">
        <form onSubmit={handleLogin}>
          <h2>Sign in</h2>
          <p style={{ opacity: .65 }}>Use the credentials your administrator gave you.</p>
          <label className="field"><span className="mono">Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
          <label className="field"><span className="mono">Password</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          {error && <div className="err" role="alert">{error}</div>}
          <button className="btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          <button type="button" className="btn ghost" onClick={() => { setEmail('admin5@gmail.com'); setPassword('admin5pass') }}>Fill judge credentials</button>
          <p style={{ fontSize: 13, opacity: .6 }}>No access yet? Ask your administrator to create an operator account for you.</p>
        </form>
      </section>
    </main>
  )
}
