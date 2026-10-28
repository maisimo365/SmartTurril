'use client';
import { useState, useEffect } from 'react';
import useMQTT from '@/hooks/useMQTT';
import TanqueAgua from '@/components/TanqueAgua';
import ModalCalibracion, { leerCalibracion } from '@/components/ModalCalibracion';

export default function Home() {
  const { nivel, distanciaCm, status } = useMQTT();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [calibracion, setCalibracion] = useState(null);

  useEffect(() => {
    setCalibracion(leerCalibracion());
  }, []);

  const isConnected = status === 'Conectado';
  const isReconnecting = status === 'Reconectando';

  return (
    <div style={styles.pageWrapper}>
      {/* Barra de navegación superior limpia y profesional */}
      <header style={styles.navbar}>
        <div style={styles.navContainer}>
          <div style={styles.brandGroup}>
            <div style={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <div style={styles.brandTitleRow}>
                <h1 style={styles.brandTitle}>SmartTurril</h1>
                <span style={styles.brandBadge}>v1.0</span>
              </div>
              <p style={styles.brandSubtitle}>Monitoreo Telemático de Nivel de Agua</p>
            </div>
          </div>

          <div style={styles.navActions}>
            {/* Estado del Broker MQTT con indicador de pulso luminoso */}
            <div style={styles.statusPill}>
              <span style={styles.pulseContainer}>
                <span
                  style={{
                    ...styles.pulseDot,
                    backgroundColor: isConnected ? '#10b981' : isReconnecting ? '#f59e0b' : '#ef4444',
                  }}
                />
                {isConnected && <span style={styles.pulseRing} />}
              </span>
              <span style={styles.statusText}>
                MQTT: <strong style={{ color: isConnected ? '#059669' : isReconnecting ? '#d97706' : '#dc2626' }}>{status}</strong>
              </span>
            </div>

            {/* Botón de Calibración */}
            <button
              id="btn-calibrar"
              onClick={() => setModalAbierto(true)}
              style={styles.btnCalibrar}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Calibrar Tanque</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={styles.mainContent}>
        <TanqueAgua nivel={nivel} distanciaCm={distanciaCm} calibracion={calibracion} />
      </main>

      {/* Pie de página con información del sistema */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Tópico MQTT:</span>
            <code style={styles.footerCode}>smartturril/tanque01/nivel</code>
          </div>
          <span style={styles.footerDivider}>•</span>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Protocolo:</span>
            <span>WebSocket WSS / QoS 0</span>
          </div>
          <span style={styles.footerDivider}>•</span>
          <div style={styles.footerItem}>
            <span style={styles.footerLabel}>Sistema:</span>
            <span>Servicios Telemáticos</span>
          </div>
        </div>
      </footer>

      {/* Modal de Calibración */}
      <ModalCalibracion
        abierto={modalAbierto}
        distanciaActual={distanciaCm}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={(nueva) => setCalibracion(nueva)}
      />

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        @media (max-width: 860px) {
          .smartturril-dashboard-container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)',
  },
  navContainer: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#0284c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
  },
  brandTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  brandBadge: {
    fontSize: '0.65rem',
    fontWeight: '700',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: '2px 0 0 0',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '0.8rem',
  },
  pulseContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '10px',
    height: '10px',
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  pulseRing: {
    position: 'absolute',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    animation: 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
  },
  statusText: {
    color: '#475569',
    fontWeight: '500',
  },
  btnCalibrar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    color: '#334155',
    fontSize: '0.825rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  mainContent: {
    flex: 1,
    padding: '28px 20px',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    padding: '16px 20px',
    marginTop: 'auto',
  },
  footerContent: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    color: '#64748b',
    fontSize: '0.775rem',
    flexWrap: 'wrap',
  },
  footerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  footerLabel: {
    fontWeight: '500',
    color: '#94a3b8',
  },
  footerCode: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
  },
  footerDivider: {
    color: '#cbd5e1',
  },
};