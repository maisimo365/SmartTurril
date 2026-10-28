'use client';
import { useState, useEffect } from 'react';

const CLAVE_STORAGE = 'smartturril_calibracion';
const MARGEN_MIN_CM = 3; // Punto ciego mínimo del HC-SR04

export function leerCalibracion() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ModalCalibracion({ abierto, onCerrar, onGuardar }) {
  const [vacio, setVacio] = useState(100);
  const [lleno, setLleno]  = useState(5);
  const [error, setError]  = useState('');
  const [ok, setOk]        = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setError(''); setOk(false);
    const cal = leerCalibracion();
    if (cal) { setVacio(cal.distanciaVacio); setLleno(cal.distanciaLleno); }
  }, [abierto]);

  function guardar() {
    const v = parseFloat(vacio), l = parseFloat(lleno);
    if (isNaN(v) || isNaN(l))   return setError('Ingresa valores numéricos.');
    if (l < MARGEN_MIN_CM)      return setError(`Mínimo ${MARGEN_MIN_CM} cm (punto ciego HC-SR04).`);
    if (v <= l)                 return setError('Vacío debe ser mayor que lleno.');
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify({ distanciaVacio: v, distanciaLleno: l }));
    setOk(true); setError('');
    setTimeout(() => { onGuardar({ distanciaVacio: v, distanciaLleno: l }); onCerrar(); }, 700);
  }

  if (!abierto) return null;

  return (
    <div style={s.overlay} onClick={onCerrar}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <h2 style={s.titulo}>⚙️ Calibración del Tanque</h2>
          <button style={s.btnX} onClick={onCerrar}>✕</button>
        </div>

        <p style={s.hint}>
          Mide con regla las distancias físicas desde el sensor HC-SR04
          hasta el fondo y hasta el nivel máximo de agua.
        </p>

        <label style={s.label}>Distancia de vacío (cm) — fondo del tanque</label>
        <input id="cal-vacio" type="number" step="0.5" value={vacio}
          onChange={e => { setVacio(e.target.value); setError(''); }}
          style={s.input} placeholder="Ej: 100" />

        <label style={s.label}>Distancia de lleno (cm) — nivel máximo permitido</label>
        <input id="cal-lleno" type="number" step="0.5" value={lleno}
          onChange={e => { setLleno(e.target.value); setError(''); }}
          style={s.input} placeholder="Ej: 5" />
        <small style={s.advertencia}>⚠️ Mínimo {MARGEN_MIN_CM} cm — punto ciego del HC-SR04</small>

        {error && <p style={s.error}>{error}</p>}

        <div style={s.footer}>
          <button style={s.btnCancelar} onClick={onCerrar}>Cancelar</button>
          <button style={{ ...s.btnGuardar, ...(ok ? s.btnOk : {}) }} onClick={guardar} disabled={ok}>
            {ok ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay:     { position:'fixed', inset:0, backgroundColor:'rgba(15,23,42,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:'1rem' },
  modal:       { backgroundColor:'#fff', borderRadius:'16px', boxShadow:'0 20px 50px rgba(0,0,0,0.18)', width:'100%', maxWidth:'420px', padding:'24px', display:'flex', flexDirection:'column', gap:'12px' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'center' },
  titulo:      { margin:0, fontSize:'1.1rem', fontWeight:'800', color:'#0f172a' },
  btnX:        { background:'#f1f5f9', border:'none', borderRadius:'8px', width:'30px', height:'30px', cursor:'pointer', fontWeight:'700', color:'#64748b' },
  hint:        { margin:0, fontSize:'0.8rem', color:'#64748b', lineHeight:'1.5' },
  label:       { fontSize:'0.85rem', fontWeight:'600', color:'#334155', marginTop:'4px' },
  input:       { padding:'9px 12px', borderRadius:'8px', border:'1.5px solid #e2e8f0', fontSize:'1rem', color:'#0f172a', fontFamily:'inherit', outline:'none' },
  advertencia: { fontSize:'0.75rem', color:'#f59e0b', marginTop:'-8px' },
  error:       { margin:0, padding:'8px 12px', backgroundColor:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', fontSize:'0.85rem', color:'#dc2626' },
  footer:      { display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'4px' },
  btnCancelar: { padding:'9px 18px', borderRadius:'8px', border:'1.5px solid #e2e8f0', backgroundColor:'#fff', color:'#475569', fontWeight:'600', cursor:'pointer' },
  btnGuardar:  { padding:'9px 22px', borderRadius:'8px', border:'none', backgroundColor:'#3b82f6', color:'#fff', fontWeight:'700', cursor:'pointer' },
  btnOk:       { backgroundColor:'#22c55e', cursor:'default' },
};
