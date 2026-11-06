'use client'
import { useState } from 'react'
import useMQTT from '@/hooks/useMQTT'
import TanqueAgua from '@/components/TanqueAgua'
import ModalCalibracion, { leerCalibracion } from '@/components/ModalCalibracion'

export default function Home() {
  const { nivel, distanciaCm, status } = useMQTT()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [calibracion, setCalibracion] = useState(leerCalibracion)
  const [mostrarTooltip, setMostrarTooltip] = useState(false)

  const isConnected = status === 'Conectado'
  const isReconnecting = status === 'Reconectando'

  return (
    <div style={styles.pageWrapper}>
      {/* Barra de navegación superior en azul profesional */}
      <header style={styles.navbar}>
        <div style={styles.navContainer}>
          <div style={styles.brandGroup}>
            <div style={styles.logoIcon}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <div style={styles.brandTitleRow}>
                <h1 style={styles.brandTitle}>SmartTurril</h1>
              </div>
              <p style={styles.brandSubtitle}>Monitoreo Telemático de Nivel de Agua</p>
            </div>
          </div>

          <div style={styles.navActions}>
            {/* Indicador de conexión LED con Tooltip Personalizado */}
            <div
              style={styles.statusWrapper}
              onMouseEnter={() => setMostrarTooltip(true)}
              onMouseLeave={() => setMostrarTooltip(false)}
            >
              <div style={styles.statusIndicator}>
                <span style={styles.pulseContainer}>
                  <span
                    style={{
                      ...styles.pulseDot,
                      backgroundColor: isConnected
                        ? '#00e676'
                        : isReconnecting
                          ? '#f59e0b'
                          : '#ef4444',
                      boxShadow: isConnected
                        ? '0 0 10px #00e676'
                        : isReconnecting
                          ? '0 0 10px #f59e0b'
                          : '0 0 10px #ef4444'
                    }}
                  />
                  {isConnected && <span style={styles.pulseRing} />}
                </span>
              </div>

              {/* Tooltip estilizado */}
              {mostrarTooltip && (
                <div style={styles.tooltipCard}>
                  <div style={styles.tooltipArrow} />
                  <span
                    style={{
                      ...styles.tooltipLed,
                      backgroundColor: isConnected ? '#00e676' : isReconnecting ? '#f59e0b' : '#ef4444',
                      boxShadow: isConnected ? '0 0 6px #00e676' : 'none'
                    }}
                  />
                  <span style={styles.tooltipTexto}>
                    {isConnected ? 'MQTT: Conectado' : isReconnecting ? 'Reconectando...' : 'MQTT: Desconectado'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barra de acción rápida para calibración fuera del encabezado */}
      <div style={styles.subBar}>
        <div style={styles.subBarContainer}>
          <button
            id="btn-calibrar"
            onClick={() => setModalAbierto(true)}
            style={styles.btnCalibrar}
            className="smartturril-btn-calibrar"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0b3b68"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Calibrar Tanque</span>
          </button>
        </div>
      </div>

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
        @media (max-width: 600px) {
          .smartturril-btn-calibrar {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  )
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column'
  },
  navbar: {
    backgroundColor: '#0b3b68', 
    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '14px 24px',
    boxShadow: '0 2px 10px rgba(11, 59, 104, 0.25)'
  },
  navContainer: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
  },
  brandTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.3px'
  },
  brandSubtitle: {
    fontSize: '0.75rem',
    color: '#bae6fd',
    margin: '2px 0 0 0'
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  statusWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  pulseContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '12px',
    height: '12px'
  },
  pulseDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  pulseRing: {
    position: 'absolute',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#00e676',
    animation: 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite'
  },
  tooltipCard: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#072b4f',
    border: '1px solid rgba(186, 230, 253, 0.35)',
    borderRadius: '8px',
    padding: '7px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    zIndex: 999,
    whiteSpace: 'nowrap',
    pointerEvents: 'none'
  },
  tooltipArrow: {
    position: 'absolute',
    top: '-5px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottom: '5px solid #072b4f'
  },
  tooltipLed: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  tooltipTexto: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: '0.2px'
  },
  subBar: {
    width: '100%',
    padding: '18px 20px 0 20px',
  },
  subBarContainer: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  btnCalibrar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#ffffff',
    background: 'radial-gradient(ellipse at center, #ffffff 65%, #f0f9ff 100%)',
    border: '1.5px solid #bfdbfe',
    borderRadius: '10px',
    color: '#0b3b68',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 8px -1px rgba(15, 23, 42, 0.05), inset 0 0 14px rgba(186, 230, 253, 0.45)',
  },
  mainContent: {
    flex: 1,
    padding: '14px 20px 28px 20px'
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #bfdbfe',
    padding: '16px 20px',
    marginTop: 'auto'
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
    flexWrap: 'wrap'
  },
  footerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  footerLabel: {
    fontWeight: '500',
    color: '#94a3b8'
  },
  footerCode: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    color: '#0369a1',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.75rem'
  },
  footerDivider: {
    color: '#cbd5e1'
  }
}
