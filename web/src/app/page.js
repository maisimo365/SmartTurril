'use client'
import { useEffect, useState, useRef } from 'react'
import useMQTT from '@/hooks/useMQTT'
import TanqueAgua from '@/components/TanqueAgua'
import ModalCalibracion, { leerCalibracion } from '@/components/ModalCalibracion'
import { guardarCalibracionLocal, inicializarCalibracionCompartida, normalizarFilaCalibracion, CALIBRACION_ID, guardarCalibracionCompartida } from '@/lib/calibracion'
import { supabase } from '@/lib/supabase'
import { registrarLecturaSupabase, enviarAlertaTelegramWeb, enviarAlertaCorreoWeb } from '@/lib/servicioAlertas'

export default function Home() {
  const { nivel, distanciaCm, status } = useMQTT()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [calibracion, setCalibracion] = useState(null)
  const [errorSincronizacion, setErrorSincronizacion] = useState(
    supabase ? '' : 'Supabase no está configurado; los cambios no se pueden compartir entre dispositivos.',
  )
  const [mostrarTooltip, setMostrarTooltip] = useState(false)

  // Estado del Servicio de Alertas y Registro en la Nube
  const [alertasActivas, setAlertasActivas] = useState(false)
  const [ultimoGuardadoTexto, setUltimoGuardadoTexto] = useState('')
  const [alertaEnviadaTexto, setAlertaEnviadaTexto] = useState('')

  const ultimoGuardadoRef = useRef(0)
  const ultimaAlertaRef = useRef(0)

  const isConnected = status === 'Conectado'
  const isReconnecting = status === 'Reconectando'

  // Carga inicial de preferencias (calibración y activación de alertas)
  useEffect(() => {
    const local = leerCalibracion()
    if (local) {
      setCalibracion(local)
    }
    try {
      const guardado = localStorage.getItem('smartturril_alertas_activas')
      if (guardado === 'true') {
        setAlertasActivas(true)
      }
    } catch {}
  }, [])

  function toggleAlertas() {
    setAlertasActivas((prev) => {
      const nuevo = !prev
      try {
        localStorage.setItem('smartturril_alertas_activas', String(nuevo))
      } catch {}
      return nuevo
    })
  }

  // Monitor en vivo: guarda en Supabase cada 30s y dispara Telegram si el nivel es crítico
  useEffect(() => {
    if (!alertasActivas) return
    if (typeof nivel !== 'number') return

    const ahora = Date.now()

    // 1. Guardar en Supabase cada 30 segundos
    if (ahora - ultimoGuardadoRef.current >= 30000) {
      ultimoGuardadoRef.current = ahora
      registrarLecturaSupabase(distanciaCm, nivel).then((res) => {
        if (res.ok) {
          const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          setUltimoGuardadoTexto(hora)
        }
      })
    }

    // 2. Alertas críticas (Telegram + Correo si nivel >= 80% con cooldown de 3 minutos)
    const UMBRAL = 80
    if (nivel >= UMBRAL) {
      const COOLDOWN_ALERTA_MS = 3 * 60 * 1000
      if (ahora - ultimaAlertaRef.current >= COOLDOWN_ALERTA_MS) {
        ultimaAlertaRef.current = ahora
        Promise.allSettled([
          enviarAlertaTelegramWeb(nivel, distanciaCm, UMBRAL),
          enviarAlertaCorreoWeb(nivel, distanciaCm, UMBRAL),
        ]).then((resultados) => {
          const exitosos = resultados.filter((r) => r.status === 'fulfilled' && r.value?.ok)
          if (exitosos.length > 0) {
            const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            setAlertaEnviadaTexto(`Alertas enviadas (${hora})`)
            setTimeout(() => setAlertaEnviadaTexto(''), 10000)
          }
        })
      }
    }
  }, [nivel, distanciaCm, alertasActivas])

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let cancelado = false
    let ultimaActualizacion = 0
    const aplicarFilaCompartida = (row) => {
      try {
        const nuevaCalibracion = normalizarFilaCalibracion(row)
        if (!nuevaCalibracion) return
        const actualizadaEn = Date.parse(row.updated_at) || Date.now()
        if (actualizadaEn < ultimaActualizacion) return
        ultimaActualizacion = actualizadaEn
        setCalibracion(nuevaCalibracion)
        guardarCalibracionLocal(nuevaCalibracion)
        setErrorSincronizacion('')
      } catch (error) {
        console.error('La calibración sincronizada no es válida:', error)
        setErrorSincronizacion(error.message || 'La calibración compartida contiene valores inválidos.')
      }
    }

    const canal = supabase
      .channel(`calibracion-${CALIBRACION_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracion_tanque', filter: `id=eq.${CALIBRACION_ID}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setCalibracion(null)
            return
          }
          aplicarFilaCompartida(payload.new)
        },
      )
      .subscribe((estado, error) => {
        if (cancelado) return
        if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') {
          console.error('No se pudo mantener la sincronización en tiempo real:', error)
          setErrorSincronizacion('No se pudo mantener la sincronización en tiempo real. Recarga la página para actualizar la calibración.')
        }
      })

    async function sincronizarCalibracion() {
      try {
        const resultado = await inicializarCalibracionCompartida()
        if (cancelado) return
        if (resultado) {
          aplicarFilaCompartida({
            distancia_vacio: resultado.calibracion.distanciaVacio,
            distancia_lleno: resultado.calibracion.distanciaLleno,
            updated_at: resultado.updatedAt,
          })
        } else {
          setCalibracion(null)
          setErrorSincronizacion('')
        }
      } catch (error) {
        console.error('No se pudo cargar la calibración compartida:', error)
        if (!cancelado) {
          setErrorSincronizacion(error.message || 'No se pudo cargar la calibración compartida.')
        }
      }
    }

    sincronizarCalibracion()
    return () => {
      cancelado = true
      supabase.removeChannel(canal)
    }
  }, [])

  async function guardarCalibracion(nueva) {
    if (!supabase) {
      guardarCalibracionLocal(nueva)
      setCalibracion(nueva)
      setErrorSincronizacion('Guardado de forma local (Supabase no está configurado para sincronizar).')
      return
    }
    const resultado = await guardarCalibracionCompartida(nueva)
    setCalibracion(resultado.calibracion)
    setErrorSincronizacion('')
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Barra de navegación superior en azul profesional */}
      <header style={styles.navbar} className="smartturril-navbar">
        <div style={styles.navContainer} className="smartturril-nav-container">
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
                      background: isConnected
                        ? 'radial-gradient(circle at 35% 30%, #dcfce7 0%, #4ade80 32%, #22c55e 68%, #15803d 100%)'
                        : isReconnecting
                          ? 'radial-gradient(circle at 35% 30%, #fef3c7 0%, #fbbf24 38%, #d97706 100%)'
                          : 'radial-gradient(circle at 35% 30%, #fee2e2 0%, #f87171 38%, #b91c1c 100%)',
                      boxShadow: isConnected
                        ? 'inset 0 1px 2px rgba(255,255,255,0.85), 0 0 8px rgba(34,197,94,0.65)'
                        : isReconnecting
                          ? 'inset 0 1px 2px rgba(255,255,255,0.75), 0 0 8px rgba(245,158,11,0.55)'
                          : 'inset 0 1px 2px rgba(255,255,255,0.7), 0 0 8px rgba(239,68,68,0.5)'
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
                      background: isConnected
                        ? 'radial-gradient(circle at 35% 30%, #dcfce7 0%, #4ade80 32%, #22c55e 68%, #15803d 100%)'
                        : isReconnecting
                          ? 'radial-gradient(circle at 35% 30%, #fef3c7 0%, #fbbf24 38%, #d97706 100%)'
                          : 'radial-gradient(circle at 35% 30%, #fee2e2 0%, #f87171 38%, #b91c1c 100%)',
                      boxShadow: isConnected ? '0 0 6px rgba(34,197,94,0.55)' : 'none'
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

      {/* Barra de acción rápida para calibración y alertas fuera del encabezado */}
      <div style={styles.subBar} className="smartturril-subbar">
        <div style={styles.subBarContainer}>
          {/* Lado izquierdo: Botón Calibrar Tanque */}
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
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Calibrar Tanque</span>
          </button>

          {/* Lado derecho: Justo por debajo de la luz del broker MQTT */}
          <div style={styles.subBarRightGroup}>
            <button
              id="btn-alertas"
              onClick={toggleAlertas}
              style={{
                ...styles.btnAlertas,
                background: alertasActivas
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #26a9e0 0%, #0879c5 100%)',
                boxShadow: alertasActivas
                  ? '0 4px 12px rgba(16, 185, 129, 0.35)'
                  : '0 4px 12px rgba(8, 121, 197, 0.28)',
              }}
              className="smartturril-btn-alertas"
              title={alertasActivas ? "Alertas activadas" : "Activar alertas"}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                {alertasActivas && (
                  <circle cx="18" cy="4" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
                )}
              </svg>
              <span>{alertasActivas ? 'Alertas Activas' : 'Activar Alertas'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main style={styles.mainContent} className="smartturril-main">
        {errorSincronizacion && (
          <p role="alert" style={styles.errorSincronizacion}>
            No se pudo sincronizar la calibración: {errorSincronizacion}
          </p>
        )}
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
        calibracion={calibracion}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={guardarCalibracion}
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
          .smartturril-navbar {
            padding: 8px 14px !important;
          }
          .smartturril-nav-container {
            gap: 8px !important;
          }
          .smartturril-subbar {
            padding: 10px 12px 0 !important;
          }
          .smartturril-main {
            padding: 12px 12px 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #dcecf8 0%, #cfe3f2 55%, #c4dced 100%)',
    display: 'flex',
    flexDirection: 'column'
  },
  navbar: {
    background: 'linear-gradient(100deg, #37aee5 0%, #54bde9 100%)',
    position: 'relative',
    zIndex: 50,
    borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
    padding: '8px 24px',
    boxShadow: '0 8px 18px rgba(28, 76, 115, 0.3)'
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.32)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(25, 99, 155, 0.12)'
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
    color: '#effaff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    border: '1px solid rgba(255, 255, 255, 0.45)',
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
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    animation: 'pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite'
  },
  tooltipCard: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    border: '1px solid #c8e7fb',
    borderRadius: '8px',
    padding: '7px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 8px 24px rgba(32, 91, 145, 0.18)',
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
    borderBottom: '5px solid #ffffff'
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
    color: '#234a78',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  subBarRightGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  btnCalibrar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    background: 'linear-gradient(135deg, #26a9e0 0%, #0879c5 100%)',
    border: '1px solid #0879c5',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 12px rgba(8, 121, 197, 0.28)',
  },
  btnAlertas: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  statusGuardadoWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 14px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    fontSize: '0.78rem',
    color: '#065f46',
    fontWeight: '600',
  },
  pulseDotGreen: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 8px #10b981',
  },
  textoGuardado: {
    color: '#065f46',
    fontWeight: '600',
  },
  badgeAlertaEnviada: {
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontWeight: '700',
    fontSize: '0.72rem',
  },
  mainContent: {
    flex: 1,
    padding: '14px 20px 28px 20px'
  },
  errorSincronizacion: {
    maxWidth: '1180px',
    margin: '0 auto 12px',
    padding: '10px 14px',
    color: '#8f1d24',
    backgroundColor: '#fff1f2',
    border: '1px solid #f5b8bc',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  footer: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderTop: '1px solid #cfe7f8',
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
    color: '#56789a',
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
    color: '#3977ad'
  },
  footerCode: {
    backgroundColor: '#eef8ff',
    border: '1px solid #c8e7fb',
    color: '#167db8',
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.75rem'
  },
  footerDivider: {
    color: '#91b5d3'
  }
}
