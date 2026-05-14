import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../lib/utils'

export default function Users() {
  const [users, setUsers] = useState([])
  const [hours, setHours] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Användare'
    document.getElementById('topbar-actions').innerHTML = ''
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: profiles } = await supabase.from('profiles').select('*').order('name')
    const { data: entries } = await supabase.from('time_entries').select('user_id, hours')
    const h = {}
    for (const e of (entries||[])) {
      h[e.user_id] = (h[e.user_id] || 0) + Number(e.hours)
    }
    setUsers(profiles || [])
    setHours(h)
    setLoading(false)
  }

  if (loading) return <div className="loading-center"><div className="spinner"/></div>

  return (
    <>
      <div className="card" style={{ marginBottom: 12, background: '#FAEEDA', border: '1px solid #FAC775' }}>
        <div style={{ fontSize: 13, color: '#633806' }}>
          <strong>Skapa nya användare</strong> via Supabase Authentication-panelen (Authentication → Add User). Ange namn, roll och initialer som metadata. De dyker sedan upp automatiskt här.
        </div>
      </div>
      <div className="card card-table">
        <table className="tbl">
          <thead>
            <tr>
              <th>Namn</th>
              <th>Roll</th>
              <th style={{ textAlign: 'right' }}>Timmar totalt</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan="3" className="empty">Inga användare ännu</td></tr>}
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ background: u.color + '22', color: u.color, width: 32, height: 32, fontSize: 12 }}>{u.initials}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-green'}`}>
                    {u.role === 'admin' ? 'Administratör' : 'Förare'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="pill">{fmt(hours[u.id] || 0)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
