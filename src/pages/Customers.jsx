import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { fmt, fmtKr } from '../lib/utils'

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Kunder'
    const btn = document.getElementById('topbar-actions')
    btn.innerHTML = ''
    const b = document.createElement('button')
    b.className = 'btn btn-primary btn-sm'
    b.textContent = '+ Ny kund'
    b.onclick = () => openNew()
    btn.appendChild(b)
    loadData()
    return () => { btn.innerHTML = '' }
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: custs } = await supabase.from('customers').select('*').order('name')
    const { data: entries } = await supabase.from('time_entries').select('hours, project:projects(customer_id, rate)')
    const s = {}
    for (const e of (entries || [])) {
      const cid = e.project?.customer_id
      if (!cid) continue
      if (!s[cid]) s[cid] = { hours: 0, revenue: 0 }
      s[cid].hours += Number(e.hours)
      s[cid].revenue += Number(e.hours) * (e.project?.rate || 0)
    }
    setCustomers(custs || [])
    setStats(s)
    setLoading(false)
  }

  function openNew() {
    setEditCustomer(null)
    setForm({ name: '', contact: '', phone: '', email: '' })
    setModal(true)
  }

  function openEdit(c) {
    setEditCustomer(c)
    setForm({ name: c.name, contact: c.contact || '', phone: c.phone || '', email: c.email || '' })
    setModal(true)
  }

  async function saveCustomer() {
    if (!form.name.trim()) return
    setSaving(true)
    if (editCustomer) {
      await supabase.from('customers').update({ ...form }).eq('id', editCustomer.id)
    } else {
      await supabase.from('customers').insert({ ...form })
    }
    setSaving(false)
    setModal(false)
    loadData()
  }

  async function deleteCustomer(id) {
    if (!confirm('Ta bort kunden och alla tillhörande projekt och tidregistreringar?')) return
    await supabase.from('customers').delete().eq('id', id)
    loadData()
  }

  if (loading) return <div className="loading-center"><div className="spinner"/></div>

  return (
    <>
      <div className="card card-table">
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Kund</th>
                <th className="col-hide">Kontakt</th>
                <th style={{ textAlign: 'right' }}>Timmar</th>
                <th className="col-hide" style={{ textAlign: 'right' }}>Omsättning</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && <tr><td colSpan="5" className="empty">Inga kunder ännu</td></tr>}
              {customers.map(c => (
                <tr key={c.id}>
                  <td><span className="clickable" onClick={() => navigate(`/customers/${c.id}`)}>{c.name}</span></td>
                  <td className="col-hide" style={{ color: '#888' }}>{c.contact}</td>
                  <td style={{ textAlign: 'right' }}><span className="pill">{fmt(stats[c.id]?.hours || 0)}</span></td>
                  <td className="col-hide" style={{ textAlign: 'right', fontWeight: 600 }}>{fmtKr(stats[c.id]?.revenue || 0)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm" onClick={() => navigate(`/customers/${c.id}`)}>Öppna →</button>
                    <button class="btn btn-sm" style={{ marginLeft: 4 }} onClick={() => openEdit(c)} title="Redigera">✏️</button>
                    <button className="btn btn-sm btn-danger" style={{ marginLeft: 4 }} onClick={() => deleteCustomer(c.id)} title="Ta bort">✕</button>
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
            <div className="modal-title">{editCustomer ? 'Redigera kund' : 'Lägg till kund'}</div>
            <div className="form-row"><label className="form-label">Kundnamn *</label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Företagsnamn" autoFocus /></div>
            <div className="form-row"><label className="form-label">Kontaktperson</label><input value={form.contact} onChange={e => setForm(f => ({...f, contact: e.target.value}))} placeholder="Namn" /></div>
            <div className="g2">
              <div className="form-row"><label className="form-label">Telefon</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="0500-000 00" /></div>
              <div className="form-row"><label className="form-label">E-post</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@foretag.se" /></div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setModal(false)}>Avbryt</button>
              <button className="btn btn-primary" onClick={saveCustomer} disabled={saving}>{saving ? 'Sparar...' : (editCustomer ? 'Spara ändringar' : 'Spara kund')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
