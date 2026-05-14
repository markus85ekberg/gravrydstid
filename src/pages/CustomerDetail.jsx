import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { fmt, fmtKr, SERVICES } from '../lib/utils'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', service: SERVICES[0], rate: 850 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const btn = document.getElementById('topbar-actions')
    btn.innerHTML = ''
    const b = document.createElement('button')
    b.className = 'btn btn-primary btn-sm'
    b.textContent = '+ Nytt projekt'
    b.onclick = () => setModal(true)
    btn.appendChild(b)
    loadData()
    return () => { btn.innerHTML = '' }
  }, [id])

  async function loadData() {
    setLoading(true)
    const { data: cust } = await supabase.from('customers').select('*').eq('id', id).single()
    const { data: projs } = await supabase.from('projects').select('*').eq('customer_id', id).order('name')
    const { data: entries } = await supabase.from('time_entries').select('hours, project_id, project:projects(rate)').in('project_id', (projs||[]).map(p=>p.id))
    const s = {}
    for (const e of (entries||[])) {
      if (!s[e.project_id]) s[e.project_id] = { hours: 0, revenue: 0 }
      s[e.project_id].hours += Number(e.hours)
      s[e.project_id].revenue += Number(e.hours) * (e.project?.rate || 0)
    }
    setCustomer(cust)
    setProjects(projs || [])
    setStats(s)
    document.getElementById('page-title').textContent = cust?.name || 'Kund'
    setLoading(false)
  }

  async function saveProject() {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('projects').insert({ customer_id: id, name: form.name, service: form.service, rate: Number(form.rate) })
    setSaving(false)
    setModal(false)
    setForm({ name: '', service: SERVICES[0], rate: 850 })
    loadData()
  }

  async function deleteProject(pid) {
    if (!confirm('Ta bort projektet och all registrerad tid?')) return
    await supabase.from('projects').delete().eq('id', pid)
    loadData()
  }

  if (loading) return <div className="loading-center"><div className="spinner"/></div>
  if (!customer) return <p>Kund hittades inte</p>

  const totalH = Object.values(stats).reduce((s, v) => s + v.hours, 0)
  const totalRev = Object.values(stats).reduce((s, v) => s + v.revenue, 0)

  return (
    <>
      <button className="back-btn" onClick={() => navigate('/customers')}>← Alla kunder</button>

      <div className="g2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Kunduppgifter</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{customer.name}</div>
          {customer.contact && <div style={{ fontSize: 13, color: '#666', marginBottom: 3 }}>👤 {customer.contact}</div>}
          {customer.phone && <div style={{ fontSize: 13, color: '#666', marginBottom: 3 }}>📞 {customer.phone}</div>}
          {customer.email && <div style={{ fontSize: 13, color: '#666' }}>✉ {customer.email}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="metric"><div className="metric-val">{fmt(totalH)}</div><div className="metric-lbl">Timmar totalt</div></div>
          <div className="metric"><div className="metric-val">{fmtKr(totalRev)}</div><div className="metric-lbl">Omsättning</div></div>
        </div>
      </div>

      <div className="card card-table">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eeecea', fontWeight: 600, fontSize: 13 }}>Projekt / Områden</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Namn</th>
                <th>Tjänst</th>
                <th style={{ textAlign: 'right' }}>Timpris</th>
                <th style={{ textAlign: 'right' }}>Timmar</th>
                <th className="col-hide" style={{ textAlign: 'right' }}>Värde</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && <tr><td colSpan="6" className="empty">Inga projekt – lägg till ett ovan</td></tr>}
              {projects.map(p => (
                <tr key={p.id}>
                  <td><span className="clickable" onClick={() => navigate(`/projects/${p.id}`)}>{p.name}</span></td>
                  <td><span className="tag">{p.service}</span></td>
                  <td style={{ textAlign: 'right', color: '#888' }}>{p.rate} kr/h</td>
                  <td style={{ textAlign: 'right' }}><span className="pill">{fmt(stats[p.id]?.hours || 0)}</span></td>
                  <td className="col-hide" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtKr(stats[p.id]?.revenue || 0)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm" onClick={() => navigate(`/projects/${p.id}`)}>Öppna →</button>
                    <button className="btn btn-sm btn-danger" style={{ marginLeft: 6 }} onClick={() => deleteProject(p.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Nytt projekt / område</div>
            <div className="form-row"><label className="form-label">Namn *</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Ex. Rise, Industrigatan..." autoFocus /></div>
            <div className="g2">
              <div className="form-row">
                <label className="form-label">Tjänst</label>
                <select value={form.service} onChange={e => setForm(f=>({...f,service:e.target.value}))}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-row"><label className="form-label">Timpris (kr/h)</label><input type="number" value={form.rate} onChange={e => setForm(f=>({...f,rate:e.target.value}))} min="0" step="50" /></div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setModal(false)}>Avbryt</button>
              <button className="btn btn-primary" onClick={saveProject} disabled={saving}>{saving ? 'Sparar...' : 'Spara projekt'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
