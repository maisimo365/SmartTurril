'use client';
import { useState } from 'react';
import useMQTT from '@/hooks/useMQTT';
import TanqueAgua from '@/components/TanqueAgua';
import ModalCalibracion from '@/components/ModalCalibracion';

export default function Home() {
  const { nivel, status } = useMQTT();
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem 1rem'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
          SmartTurril
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>
          Estado del Broker: <strong style={{ color: status.includes('Conectado') ? '#22c55e' : '#ef4444' }}>{status}</strong>
        </p>
        <button
          id="btn-calibrar"
          onClick={() => setModalAbierto(true)}
          style={{ marginTop: '0.75rem', padding: '8px 18px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: '#fff', color: '#334155', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Calibrar tanque
        </button>
      </header>

      <TanqueAgua nivel={nivel} />

      <footer style={{
        textAlign: 'center',
        marginTop: '3rem',
        color: '#94a3b8',
        fontSize: '0.875rem'
      }}>
        <p>Suscrito al tópico: <code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>smartturril/tanque01/nivel</code></p>
      </footer>
      <ModalCalibracion
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={() => { }}
      />
    </main>
  );
}