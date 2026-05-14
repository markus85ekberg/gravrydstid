import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Fel e-post eller lösenord.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f3', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚜</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1D9E75' }}>Gravryds Last & Loss</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Projektverktyg</div>
        </div>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-row">
            <label className="form-label">E-post</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="namn@foretag.se" required autoFocus />
          </div>
          <div className="form-row">
            <label className="form-label">Lösenord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '10px' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }}/> Loggar in...</> : 'Logga in'}
          </button>
        </form>
        <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 20 }}>
          Kontakta administratören för inloggningsuppgifter
        </p>
      </div>
    </div>
  )
}
