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
                width="30"
                height="30"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Base oval inferior oscura */}
                <ellipse cx="32" cy="56" rx="24" ry="5.5" fill="#091b2e" />

                {/* Cuerpo cilíndrico celeste */}
                <path
                  d="M 14 18 C 14 13 21 11 32 11 C 43 11 50 13 50 18 L 50 49 C 50 54 42 56 32 56 C 22 56 14 54 14 49 Z"
                  fill="#38bdf8"
                />

                {/* Interior del borde superior */}
                <path
                  d="M 14 18 C 14 14 21 17 32 17 C 43 17 50 14 50 18 C 50 22 43 25 32 25 C 21 25 14 22 14 18 Z"
                  fill="#091b2e"
                />
                <ellipse cx="32" cy="18" rx="16" ry="4.5" fill="#0e2a47" />

                {/* Reborde superior celeste brillante */}
                <path
                  d="M 14 18 C 14 12 20 10 32 10 C 44 10 50 12 50 18 C 47 16 41 15 32 15 C 23 15 17 16 14 18 Z"
                  fill="#7dd3fc"
                />

                {/* Marco rectangular blanco en la cara frontal */}
                <rect x="17" y="24" width="30" height="26" rx="2" fill="#ffffff" />

                {/* Ventana interior azul marino profundo */}
                <rect x="19.5" y="26.5" width="25" height="21" rx="1.5" fill="#0b1d30" />

                {/* Gota de agua blanca en el centro */}
                <path
                  d="M 32 30 C 32 30 25.5 38 25.5 40.5 C 25.5 43.8 28.4 45.5 32 45.5 C 35.6 45.5 38.5 43.8 38.5 40.5 C 38.5 38 32 30 32 30 Z"
                  fill="#ffffff"
                />
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
              stroke="#0284c7"
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
    background: 'linear-gradient(180deg, #1964a7 0%, #124d85 30%, #0d3b68 65%, #082d54 100%)',
    display: 'flex',
    flexDirection: 'column'
  },
  navbar: {
    backgroundColor: '#072b4f', 
    position: 'relative',
    zIndex: 50,
    borderBottom: 'none',
    padding: '8px 24px',
    boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.5), 0 4px 10px rgba(0, 0, 0, 0.3)'
  },
  navContainer: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
  },
  brandTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  brandTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: '-0.3px'
  },
  brandSubtitle: {
    fontSize: '0.7rem',
    color: '#7dd3fc',
    margin: '1px 0 0 0'
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
    border: '1px solid rgba(56, 189, 248, 0.35)',
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
    border: '1px solid rgba(56, 189, 248, 0.45)',
    borderRadius: '8px',
    padding: '7px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
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
    padding: '12px 20px 0 20px',
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
    background: 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #bae6fd 0%, #38bdf8 50%, #0284c7 100%) border-box',
    border: '2px solid transparent',
    borderRadius: '10px',
    color: '#072b4f',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 15px rgba(56, 189, 248, 0.25), 0 2px 6px rgba(0, 0, 0, 0.08)',
  },
  mainContent: {
    flex: 1,
    padding: '14px 20px 28px 20px'
  },
  footer: {
    backgroundColor: '#05223f',
    borderTop: '1px solid rgba(56, 189, 248, 0.2)',
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
    color: '#93c5fd',
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
    color: '#7dd3fc'
  },
  footerCode: {
    backgroundColor: 'rgba(5, 26, 50, 0.8)',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    color: '#38bdf8',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.75rem'
  },
  footerDivider: {
    color: 'rgba(56, 189, 248, 0.4)'
  }
}
