import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { fmt, fmtKr, SERVICES } from '../lib/utils'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [project, setProject] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [profiles, setProfiles] = useState([])
  const today = new Date().toISOString().slice(0,10)
  const [form, setForm] = useState({ date: today, hours: '', service: '', note: '', user_id: profile?.id })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const btn = document.getElementById('topbar-actions')
    btn.innerHTML = ''
    const b = document.createElement('button')
    b.className = 'btn btn-primary btn-sm'
    b.textContent = '+ Registrera tid'
    b.onclick = () => setModal(true)
    btn.appendChild(b)
    loadData()
    return () => { btn.innerHTML = '' }
  }, [id])

  async function loadData() {
    setLoading(true)
    const { data: proj } = await supabase.from('projects').select('*, customer:customers(*)').eq('id', id).single()
    const { data: ents } = await supabase.from('time_entries').select('*, user:profiles(*)').eq('project_id', id).order('date', { ascending: false })
    if (isAdmin) {
      const { data: profs } = await supabase.from('profiles').select('*').order('name')
      setProfiles(profs || [])
    }
    setProject(proj)
    setEntries(ents || [])
    document.getElementById('page-title').textContent = proj?.name || 'Projekt'
    setForm(f => ({ ...f, service: proj?.service || SERVICES[0] }))
    setLoading(false)
  }

  async function saveEntry() {
    if (!form.date || !form.hours || Number(form.hours) <= 0) return
    setSaving(true)
    await supabase.from('time_entries').insert({
      project_id: id,
      user_id: isAdmin ? form.user_id : profile.id,
      date: form.date,
      hours: Number(form.hours),
      service: form.service,
      note: form.note,
    })
    setSaving(false)
    setModal(false)
    setForm(f => ({ ...f, hours: '', note: '' }))
    loadData()
  }

  async function deleteEntry(eid) {
    if (!confirm('Ta bort registreringen?')) return
    await supabase.from('time_entries').delete().eq('id', eid)
    loadData()
  }

  if (loading) return <div className="loading-center"><div className="spinner"/></div>
  if (!project) return <p>Projekt hittades inte</p>

  const totalH = entries.reduce((s,e) => s + Number(e.hours), 0)
  const totalRev = totalH * project.rate

  return (
    <>
      <button className="back-btn" onClick={() => navigate(`/customers/${project.customer_id}`)}>← {project.customer?.name}</button>

      <div className="g4" style={{ marginBottom: 14 }}>
        <div className="metric"><div className="metric-val">{fmt(totalH)}</div><div className="metric-lbl">Timmar totalt</div></div>
        <div className="metric"><div className="metric-val">{fmtKr(totalRev)}</div><div className="metric-lbl">Värde</div></div>
        <div className="metric"><div className="metric-val">{entries.length}</div><div className="metric-lbl">Registreringar</div></div>
        <div className="metric"><div className="metric-val" style={{ fontSize: 16 }}>{project.rate} kr/h</div><div className="metric-lbl">Timpris</div></div>
      </div>

      <div className="card card-table">
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eeecea', fontWeight: 600, fontSize: 13 }}>
          Tidsregistreringar
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Datum</th>
                {isAdmin && <th>Förare</th>}
                <th>Tjänst</th>
                <th style={{ textAlign: 'right' }}>Timmar</th>
                <th className="col-hide" style={{ textAlign: 'right' }}>Värde</th>
                <th>Anteckning</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan="7" className="empty">Ingen tid registrerad ännu</td></tr>}
              {entries.map(e => {
                const u = e.user
                const svc = e.service || project.service
                return <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{e.date}</td>
                  {isAdmin && <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: 10, background: (u?.color||'#1D9E75')+'22', color: u?.color||'#1D9E75' }}>{u?.initials}</div>
                      <span style={{ fontSize: 12 }}>{u?.name || '-'}</span>
                    </div>
                  </td>}
                  <td><span className="tag">{svc}</span></td>
                  <td style={{ textAlign: 'right' }}><span className="pill">{fmt(Number(e.hours))}</span></td>
                  <td className="col-hide" style={{ textAlign: 'right', color: '#888' }}>{fmtKr(Number(e.hours)*project.rate)}</td>
                  <td style={{ color: '#888', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    {(isAdmin || e.user_id === profile.id) &&
                      <button className="btn btn-sm btn-danger" onClick={() => deleteEntry(e.id)}>✕</button>}
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Registrera tid – {project.name}</div>
            <div className="g2">
              <div className="form-row"><label className="form-label">Datum *</label><input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></div>
              <div className="form-row"><label className="form-label">Timmar *</label><input type="number" value={form.hours} onChange={e => setForm(f=>({...f,hours:e.target.value}))} min="0.5" max="24" step="0.5" placeholder="3.5" autoFocus /></div>
            </div>
            <div className="form-row">
              <label className="form-label">Tjänst</label>
              <select value={form.service} onChange={e => setForm(f=>({...f,service:e.target.value}))}>
                {SERVICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {isAdmin && profiles.length > 0 && (
              <div className="form-row">
                <label className="form-label">Förare</label>
                <select value={form.user_id} onChange={e => setForm(f=>({...f,user_id:e.target.value}))}>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-row"><label className="form-label">Anteckning</label><input value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} placeholder="Valfritt..." /></div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setModal(false)}>Avbryt</button>
              <button className="btn btn-primary" onClick={saveEntry} disabled={saving}>{saving ? 'Sparar...' : 'Spara'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
