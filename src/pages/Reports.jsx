import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { fmt, fmtKr, MONTHS } from '../lib/utils'
import * as XLSX from 'xlsx'

export default function Reports() {
  const [customers, setCustomers] = useState([])
  const [selCust, setSelCust] = useState('')
  const [selMonth, setSelMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef()

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Rapporter'
    document.getElementById('topbar-actions').innerHTML = ''
    supabase.from('customers').select('*').order('name').then(({ data }) => setCustomers(data || []))
  }, [])

  async function generateReport() {
    if (!selCust || !selMonth) return
    setLoading(true)
    const [year, month] = selMonth.split('-').map(Number)
    const monthStart = `${year}-${String(month).padStart(2,'0')}-01`
    const monthEnd = `${year}-${String(month).padStart(2,'0')}-31`

    const { data: projs } = await supabase.from('projects').select('*').eq('customer_id', selCust)
    const { data: entries } = await supabase.from('time_entries')
      .select('*, user:profiles(name)')
      .in('project_id', (projs||[]).map(p=>p.id))
      .gte('date', monthStart).lte('date', monthEnd)
      .order('date')

    const rows = (projs||[]).map(p => {
      const ents = (entries||[]).filter(e => e.project_id === p.id)
      return { p, ents, h: ents.reduce((s,e)=>s+Number(e.hours),0) }
    }).filter(r => r.ents.length > 0)

    const cust = customers.find(c => String(c.id) === String(selCust))
    setReport({ rows, cust, month, year, totH: rows.reduce((s,r)=>s+r.h,0), totRev: rows.reduce((s,r)=>s+r.h*r.p.rate,0) })
    setLoading(false)
  }

  function exportExcel() {
    if (!report) return
    const rows = []
    for (const r of report.rows) {
      for (const e of r.ents) {
        rows.push({
          Datum: e.date,
          Kund: report.cust?.name || '',
          Projekt: r.p.name,
          Tjänst: r.p.service,
          Förare: e.user?.name || '',
          Timmar: Number(e.hours),
          'Timpris (kr)': r.p.rate,
          'Värde (kr)': Math.round(Number(e.hours) * r.p.rate),
          Anteckning: e.note || '',
        })
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [12,28,20,16,16,8,12,12,24].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tidrapport')
    XLSX.writeFile(wb, `gravryds-${report.cust?.name?.replace(/\s/g,'_') || 'rapport'}-${selMonth}.xlsx`)
  }

  function printReport() { window.print() }

  return (
    <>
      <div className="card">
        <div className="section-title" style={{ marginBottom: 14 }}>Generera rapport</div>
        <div className="g2" style={{ marginBottom: 12 }}>
          <div className="form-row">
            <label className="form-label">Kund</label>
            <select value={selCust} onChange={e => setSelCust(e.target.value)}>
              <option value="">Välj kund...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Månad</label>
            <input type="month" value={selMonth} onChange={e => setSelMonth(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={generateReport} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }}/> Laddar...</> : '📄 Visa rapport'}
          </button>
          {report && <>
            <button className="btn btn-sm" onClick={exportExcel}>📊 Exportera Excel</button>
            <button className="btn btn-sm" onClick={printReport}>🖨 Skriv ut / PDF</button>
          </>}
        </div>
      </div>

      {report && (
        <div className="card" ref={printRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Tidrapport — {MONTHS[report.month-1]} {report.year}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>Uppdragsgivare: <strong>{report.cust?.name}</strong> · {report.cust?.contact}</div>
              <div style={{ fontSize: 13, color: '#666' }}>Utförare: Gravryds Last & Loss</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="pill" style={{ fontSize: 14, padding: '5px 14px', marginBottom: 4 }}>{fmt(report.totH)}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtKr(report.totRev)}</div>
            </div>
          </div>

          {report.rows.length === 0
            ? <div className="empty">Ingen tid registrerad för denna period</div>
            : report.rows.map(r => (
              <div key={r.p.id} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 13, paddingBottom: 6, borderBottom: '1px solid #eeecea', marginBottom: 6 }}>
                  <span>📍 {r.p.name} <span className="tag" style={{ marginLeft: 6 }}>{r.p.service}</span></span>
                  <span style={{ color: '#666' }}>{fmt(r.h)} · {fmtKr(r.h * r.p.rate)}</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="tbl" style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Förare</th>
                        <th style={{ textAlign: 'right' }}>Timmar</th>
                        <th style={{ textAlign: 'right' }}>Värde ({r.p.rate} kr/h)</th>
                        <th>Anteckning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.ents.map(e => (
                        <tr key={e.id}>
                          <td>{e.date}</td>
                          <td>{e.user?.name || '-'}</td>
                          <td style={{ textAlign: 'right' }}><span className="pill">{fmt(Number(e.hours))}</span></td>
                          <td style={{ textAlign: 'right' }}>{fmtKr(Number(e.hours)*r.p.rate)}</td>
                          <td style={{ color: '#888' }}>{e.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          }

          <div style={{ borderTop: '2px solid #eeecea', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
            <span>Totalt</span>
            <span>{fmt(report.totH)} &nbsp;|&nbsp; {fmtKr(report.totRev)}</span>
          </div>
        </div>
      )}
    </>
  )
}
