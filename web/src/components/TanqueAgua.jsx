'use client';
import { useState, useEffect } from 'react';
import { CONFIG_TANQUE, UMBRALES_ALERTA } from '@/config/tanque';
import CirculoProgreso from '@/components/CirculoProgreso';
import TarjetaMedicion from '@/components/TarjetaMedicion';

export default function TanqueAgua({ nivel }) {
  const { distanciaVacio, distanciaLleno, alturaTuboDesdeBase } = CONFIG_TANQUE;
  const { criticoBajo, criticoAlto } = UMBRALES_ALERTA;
  
  const nivelClamped = Math.max(0, Math.min(100, nivel));
  
  const distanciaActual = distanciaVacio - (nivelClamped / 100) * (distanciaVacio - distanciaLleno);
  const alturaAguaDesdeBase = distanciaVacio - distanciaActual;
  
  const alturaUtilTotal = distanciaVacio - alturaTuboDesdeBase;
  const porcentajeUtil = alturaAguaDesdeBase > alturaTuboDesdeBase 
    ? ((alturaAguaDesdeBase - alturaTuboDesdeBase) / alturaUtilTotal) * 100 
    : 0;

  let estadoTexto = 'Normal';
  let colorPrimario = '#3b82f6';
  let colorGradienteInicio = '#60a5fa';
  let colorGradienteFin = '#2563eb';
  let iconoEstado = '✓';

  if (nivelClamped < criticoBajo) {
    estadoTexto = 'Nivel Crítico';
    colorPrimario = '#ef4444';
    colorGradienteInicio = '#f87171';
    colorGradienteFin = '#dc2626';
    iconoEstado = '️';
  } else if (nivelClamped > criticoAlto) {
    estadoTexto = 'Riesgo de Desborde';
    colorPrimario = '#f59e0b';
    colorGradienteInicio = '#fbbf24';
    colorGradienteFin = '#d97706';
    iconoEstado = '⚡';
  }

  const [historial, setHistorial] = useState([]);
  useEffect(() => {
    setHistorial(prev => {
      const nuevo = [...prev, nivelClamped];
      return nuevo.length > 20 ? nuevo.slice(-20) : nuevo;
    });
  }, [nivelClamped]);

  const porcentajeVisualTubo = (alturaTuboDesdeBase / distanciaVacio) * 100;

  return (
    <div style={styles.contenedorPrincipal}>
      <div className="smartturril-tarjeta" style={styles.tarjeta}>
        <div className="smartturril-header" style={styles.header}>
          <h2 className="smartturril-titulo" style={styles.titulo}>Monitor de Nivel</h2>
          <div style={styles.indicadorEstado}>
            <span style={{...styles.iconoEstado, backgroundColor: colorPrimario}}>{iconoEstado}</span>
            <span style={styles.textoEstado}>{estadoTexto}</span>
          </div>
        </div>

        <div className="smartturril-contenido" style={styles.contenidoTanque}>
          <div style={styles.metricasMixtas}>
            <div className="smartturril-fila-circulos" style={styles.filaCirculos}>
              <CirculoProgreso
                valor={nivelClamped}
                maximo={100}
                color={colorPrimario}
                etiqueta="Nivel de Llenado"
                unidad="%"
              />
              <CirculoProgreso
                valor={porcentajeUtil}
                maximo={100}
                color={porcentajeUtil < 20 ? '#ef4444' : '#0ea5e9'}
                etiqueta="Nivel útil"
                unidad="%"
              />
            </div>

            <div className="smartturril-fila-tarjetas" style={styles.filaTarjetas}>
              <TarjetaMedicion
                valor={distanciaActual}
                maximo={distanciaVacio}
                color="#8b5cf6"
                etiqueta="Distancia al agua"
                unidad="cm"
              />
              <TarjetaMedicion
                valor={alturaAguaDesdeBase}
                maximo={distanciaVacio}
                color="#10b981"
                etiqueta="Altura del agua"
                unidad="cm"
              />
            </div>
          </div>

          <div className="smartturril-tanque-container" style={styles.tanqueContainer}>
            <div className="smartturril-tanque" style={styles.tanque}>
              <div className="smartturril-sensor" style={styles.sensor}>
                <span style={styles.iconoSensor}></span>
                <span className="smartturril-texto-sensor" style={styles.textoSensor}>Sensor<br/>{distanciaVacio}cm</span>
              </div>

              <div style={{...styles.zonaTubo, height: `${porcentajeVisualTubo}%`}}>
                <span style={styles.textoZonaTubo}>Zona<br/>Tubo<br/>({alturaTuboDesdeBase}cm)</span>
              </div>

              <div style={{
                ...styles.liquido,
                height: `${nivelClamped}%`,
                background: `linear-gradient(to top, ${colorGradienteFin}, ${colorGradienteInicio})`,
              }}>
                <div style={styles.onda}></div>
              </div>
              
              <div className="smartturril-marcas" style={styles.marcas}>
                {[100, 75, 50, 25, 0].map((marca) => (
                  <div key={marca} style={styles.marca}>
                    <span style={styles.marcaLinea}></span>
                    <span style={styles.marcaTexto}>{marca}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="smartturril-indicador-lateral" style={styles.indicadorLateral}>
              <span style={{...styles.indicadorNumero, color: colorPrimario}}>{nivelClamped}%</span>
            </div>
          </div>
        </div>

        <div style={styles.seccionGrafico}>
          <h3 style={styles.tituloGrafico}>Historial de profundidad</h3>
          <div style={styles.graficoContainer}>
            <svg style={styles.grafico} viewBox="0 0 400 100" preserveAspectRatio="none">
              {historial.length > 1 && (
                <>
                  <path
                    d={`M ${historial.map((v, i) => `${(i / (historial.length - 1)) * 400} ${100 - (v / 100) * 100}`).join(' L ')}`}
                    fill="none" stroke={colorPrimario} strokeWidth="2"
                  />
                  <path
                    d={`M 0 100 L ${historial.map((v, i) => `${(i / Math.max(historial.length - 1, 1)) * 400} ${100 - (v / 100) * 100}`).join(' L ')} L 400 100 Z`}
                    fill={`${colorPrimario}20`}
                  />
                </>
              )}
            </svg>
          </div>
          <div style={styles.leyendaGrafico}>
            <button style={{...styles.botonLeyenda, backgroundColor: colorPrimario}}>Tiempo real</button>
            <button style={styles.botonLeyendaInactivo}>Por hora</button>
            <button style={styles.botonLeyendaInactivo}>Por día</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes onda {
          0%, 100% { transform: translateY(0) scaleX(1); }
          50% { transform: translateY(-4px) scaleX(1.1); }
        }

        @media (max-width: 768px) {
          .smartturril-contenido {
            flex-direction: column !important;
            align-items: center !important;
            gap: 30px !important;
          }
          .smartturril-tanque-container {
            align-items: center !important;
          }
          .smartturril-marcas {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .smartturril-tarjeta {
            padding: 16px !important;
          }
          .smartturril-titulo {
            font-size: 1.1rem !important;
          }
          .smartturril-fila-circulos {
            flex-direction: column !important;
            align-items: center !important;
          }
          .smartturril-fila-tarjetas {
            flex-direction: column !important;
          }
          .smartturril-tanque {
            width: 80px !important;
            height: 260px !important;
          }
          .smartturril-indicador-lateral {
            display: none !important;
          }
          .smartturril-sensor {
            padding: 2px 6px !important;
          }
          .smartturril-texto-sensor {
            font-size: 0.6rem !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  contenedorPrincipal: { display: 'flex', justifyContent: 'center', padding: '20px', width: '100%', maxWidth: '700px', margin: '0 auto' },
  tarjeta: { backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', padding: '24px', width: '100%', border: '1px solid #f1f5f9' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' },
  titulo: { fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', margin: 0 },
  indicadorEstado: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#f8fafc', borderRadius: '20px' },
  iconoEstado: { width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' },
  textoEstado: { fontSize: '0.875rem', fontWeight: '600', color: '#475569' },
  contenidoTanque: { display: 'flex', gap: '40px', marginBottom: '24px', alignItems: 'flex-start' },
  metricasMixtas: { display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' },
  filaCirculos: { display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-around', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' },
  filaTarjetas: { display: 'flex', gap: '16px', justifyContent: 'space-between' },
  metricaItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  metricaLabel: { fontSize: '0.875rem', color: '#64748b', fontWeight: '500' },
  porcentajeGrande: { fontSize: '2.5rem', fontWeight: '800', lineHeight: 1 },
  valorMetrica: { fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' },
  tanqueContainer: { display: 'flex', alignItems: 'flex-end', gap: '16px' },
  tanque: { width: '100px', height: '320px', border: '3px solid #e2e8f0', borderRadius: '12px', position: 'relative', overflow: 'hidden', backgroundColor: '#f8fafc' },
  sensor: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'white', border: '2px solid #3b82f6', borderRadius: '8px', padding: '4px 8px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  iconoSensor: { fontSize: '18px' },
  textoSensor: { fontSize: '0.65rem', color: '#3b82f6', fontWeight: '700', textAlign: 'center', lineHeight: '1.1' },
  zonaTubo: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#f1f5f9', border: '2px dashed #94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 },
  textoZonaTubo: { fontSize: '0.7rem', color: '#64748b', textAlign: 'center', fontWeight: '600', lineHeight: '1.2' },
  liquido: { position: 'absolute', bottom: 0, left: 0, width: '100%', transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '0 0 9px 9px', zIndex: 1 },
  onda: { position: 'absolute', top: '-8px', left: 0, width: '100%', height: '16px', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '50%', animation: 'onda 2s ease-in-out infinite' },
  marcas: { position: 'absolute', right: '-50px', top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '5px 0' },
  marca: { display: 'flex', alignItems: 'center', gap: '8px' },
  marcaLinea: { width: '12px', height: '1px', backgroundColor: '#94a3b8' },
  marcaTexto: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' },
  indicadorLateral: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '320px' },
  indicadorNumero: { fontSize: '1.5rem', fontWeight: '800', writingMode: 'vertical-rl', textOrientation: 'mixed' },
  seccionGrafico: { marginTop: '16px' },
  tituloGrafico: { fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '12px' },
  graficoContainer: { height: '80px', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '8px', overflow: 'hidden' },
  grafico: { width: '100%', height: '100%' },
  leyendaGrafico: { display: 'flex', gap: '8px', marginTop: '12px' },
  botonLeyenda: { padding: '6px 16px', borderRadius: '8px', border: 'none', color: 'white', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
  botonLeyendaInactivo: { padding: '6px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' },
};