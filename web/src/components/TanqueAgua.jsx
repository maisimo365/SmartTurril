'use client';
import { useState, useEffect } from 'react';
import { CONFIG_TANQUE, UMBRALES_ALERTA } from '@/config/tanque';

export default function TanqueAgua({ nivel = 0, distanciaCm = null, calibracion }) {
  const distanciaVacio = calibracion?.distanciaVacio ?? CONFIG_TANQUE.distanciaVacio;
  const distanciaLleno = calibracion?.distanciaLleno ?? CONFIG_TANQUE.distanciaLleno;
  const { alturaTuboDesdeBase, capacidadLitros = 1000 } = CONFIG_TANQUE;
  const { criticoBajo, criticoAlto } = UMBRALES_ALERTA;

  // Si recibimos distanciaCm en vivo, calculamos el porcentaje con la calibración activa
  let nivelCalculado = nivel;
  if (distanciaCm !== null && distanciaVacio > distanciaLleno) {
    const rango = distanciaVacio - distanciaLleno;
    nivelCalculado = ((distanciaVacio - distanciaCm) / rango) * 100;
  }

  const nivelClamped = Math.max(0, Math.min(100, Math.round(nivelCalculado * 10) / 10));

  const distanciaActual = distanciaCm !== null
    ? Math.round(distanciaCm * 10) / 10
    : Math.max(0, distanciaVacio - (nivelClamped / 100) * (distanciaVacio - distanciaLleno));
  const alturaAguaDesdeBase = Math.max(0, distanciaVacio - distanciaActual);

  const alturaUtilTotal = Math.max(1, distanciaVacio - alturaTuboDesdeBase);
  const porcentajeUtil = alturaAguaDesdeBase > alturaTuboDesdeBase
    ? Math.min(100, Math.max(0, ((alturaAguaDesdeBase - alturaTuboDesdeBase) / alturaUtilTotal) * 100))
    : 0;

  // Cálculo de volumen en litros
  const litrosTotales = Math.round((nivelClamped / 100) * capacidadLitros);
  const litrosUtiles = Math.round((porcentajeUtil / 100) * (alturaUtilTotal / distanciaVacio) * capacidadLitros);

  // Estados y colores profesionales
  let estadoKey = 'normal';
  let estadoTexto = 'Nivel Normal';
  let colorPrimario = '#0284c7'; // Azul profesional
  let colorFondoBadge = '#e0f2fe';
  let colorTextoBadge = '#0369a1';
  let colorGradienteAguaInicio = '#38bdf8';
  let colorGradienteAguaFin = '#0284c7';

  if (nivelClamped < criticoBajo) {
    estadoKey = 'critico';
    estadoTexto = 'Nivel Crítico';
    colorPrimario = '#ef4444'; // Rojo alarma
    colorFondoBadge = '#fee2e2';
    colorTextoBadge = '#b91c1c';
    colorGradienteAguaInicio = '#f87171';
    colorGradienteAguaFin = '#dc2626';
  } else if (nivelClamped > criticoAlto) {
    estadoKey = 'alerta';
    estadoTexto = 'Riesgo de Desborde';
    colorPrimario = '#f59e0b'; // Ámbar advertencia
    colorFondoBadge = '#fef3c7';
    colorTextoBadge = '#b45309';
    colorGradienteAguaInicio = '#fbbf24';
    colorGradienteAguaFin = '#d97706';
  }

  // Historial de profundidad
  const [historial, setHistorial] = useState([]);
  const [filtroTiempo, setFiltroTiempo] = useState('real');

  useEffect(() => {
    setHistorial(prev => {
      const nuevo = [...prev, { nivel: nivelClamped, timestamp: new Date() }];
      return nuevo.length > 25 ? nuevo.slice(-25) : nuevo;
    });
  }, [nivelClamped]);

  // Dimensiones del visor dentro del tanque SVG
  // El cuerpo cilíndrico del tanque va desde Y=125 hasta Y=395 (altura = 270px)
  const tankTopY = 125;
  const tankBottomY = 395;
  const tankHeight = tankBottomY - tankTopY; // 270px
  const waterHeightPx = (nivelClamped / 100) * tankHeight;
  const waterTopY = tankBottomY - waterHeightPx;

  // Nivel del tubo de salida en el visor
  const porcentajeTubo = Math.min(100, Math.max(0, (alturaTuboDesdeBase / distanciaVacio) * 100));
  const tuboY = tankBottomY - (porcentajeTubo / 100) * tankHeight;

  return (
    <div style={styles.dashboardContainer} className="smartturril-dashboard-container">
      {/* Columna Izquierda: Representación realista del Tanque Industrial */}
      <div style={styles.tanqueCard}>
        <div style={styles.cardHeader}>
          <div style={styles.headerTitleGroup}>
            <span style={styles.cardSubtitle}>Visualización en tiempo real</span>
            <h2 style={styles.cardTitle}>Tanque de Almacenamiento</h2>
          </div>
          <div style={{ ...styles.badgeEstado, backgroundColor: colorFondoBadge, color: colorTextoBadge }}>
            {estadoKey === 'normal' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {estadoKey === 'alerta' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            {estadoKey === 'critico' && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{estadoTexto}</span>
          </div>
        </div>

        {/* Ilustración SVG del Tanque Industrial Idéntico a la Imagen */}
        <div style={styles.tanqueSvgWrapper}>
          <svg
            viewBox="0 0 340 440"
            style={styles.tanqueSvg}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Sombra base suave bajo el tanque */}
              <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#0f172a" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>

              {/* Degradado cilíndrico del cuerpo de plástico negro */}
              <linearGradient id="tankBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#141518" />
                <stop offset="12%" stopColor="#25272c" />
                <stop offset="28%" stopColor="#373a42" /> {/* brillo satinado */}
                <stop offset="50%" stopColor="#202226" />
                <stop offset="82%" stopColor="#131416" />
                <stop offset="100%" stopColor="#090a0c" />
              </linearGradient>

              {/* Degradado para la cúpula inclinada */}
              <linearGradient id="tankDomeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#17181c" />
                <stop offset="25%" stopColor="#30333a" />
                <stop offset="50%" stopColor="#222429" />
                <stop offset="85%" stopColor="#121316" />
                <stop offset="100%" stopColor="#0a0b0d" />
              </linearGradient>

              {/* Degradado para la tapa roscada superior */}
              <linearGradient id="tankCapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#181a1d" />
                <stop offset="30%" stopColor="#34373e" />
                <stop offset="60%" stopColor="#1e2024" />
                <stop offset="100%" stopColor="#0d0e10" />
              </linearGradient>

              {/* Degradado metálico de latón/bronce para la válvula inferior */}
              <linearGradient id="brassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#ca8a04" />
                <stop offset="70%" stopColor="#854d0e" />
                <stop offset="100%" stopColor="#452a06" />
              </linearGradient>

              {/* Degradado del fluido de agua */}
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={colorGradienteAguaInicio} />
                <stop offset="100%" stopColor={colorGradienteAguaFin} />
              </linearGradient>

              {/* Reflejo de cristal para el visor de nivel */}
              <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
                <stop offset="25%" stopColor="#ffffff" stopOpacity="0.03" />
                <stop offset="80%" stopColor="#000000" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
              </linearGradient>
            </defs>

            {/* Sombra de contacto en el suelo */}
            <ellipse cx="170" cy="416" rx="120" ry="12" fill="url(#groundShadow)" />

            {/* BASE Y FONDO DEL TANQUE (Esquinas redondeadas) */}
            <path
              d="M 50 380 Q 50 405 70 405 L 270 405 Q 290 405 290 380 Z"
              fill="#111215"
            />

            {/* CUERPO CILÍNDRICO PRINCIPAL NEGRO */}
            <rect
              x="50"
              y="125"
              width="240"
              height="260"
              fill="url(#tankBodyGrad)"
            />

            {/* CÚPULA SUPERIOR CÓNICA CON NERVADURAS */}
            <path
              d="M 50 125 
                 C 50 115 70 95 118 68 
                 L 222 68 
                 C 270 95 290 115 290 125 
                 Z"
              fill="url(#tankDomeGrad)"
            />

            {/* NERVADURAS RADIALES MOLDEADAS DE LA CÚPULA (idénticas a la foto) */}
            <g stroke="#0f1013" strokeWidth="1.8" opacity="0.65">
              <line x1="125" y1="68" x2="65" y2="124" />
              <line x1="140" y1="68" x2="100" y2="125" />
              <line x1="155" y1="68" x2="135" y2="125" />
              <line x1="170" y1="68" x2="170" y2="125" />
              <line x1="185" y1="68" x2="205" y2="125" />
              <line x1="200" y1="68" x2="240" y2="125" />
              <line x1="215" y1="68" x2="275" y2="124" />
            </g>
            {/* Realces de luz sutiles en nervaduras */}
            <g stroke="#ffffff" strokeWidth="0.8" opacity="0.18">
              <line x1="126" y1="68" x2="66" y2="124" />
              <line x1="141" y1="68" x2="101" y2="125" />
              <line x1="156" y1="68" x2="136" y2="125" />
              <line x1="171" y1="68" x2="171" y2="125" />
            </g>

            {/* CUELLO DE LA TAPA */}
            <rect
              x="116"
              y="54"
              width="108"
              height="15"
              rx="3"
              fill="#181a1e"
              stroke="#0e0f11"
              strokeWidth="1.5"
            />

            {/* TAPA ROSCADA SUPERIOR CON MUESCAS DE AGARRE */}
            <rect
              x="122"
              y="38"
              width="96"
              height="18"
              rx="5"
              fill="url(#tankCapGrad)"
              stroke="#0a0b0d"
              strokeWidth="1.5"
            />
            {/* Domo central y nervaduras de la tapa */}
            <rect x="156" y="32" width="28" height="7" rx="3.5" fill="#1b1d21" />
            <g stroke="#0d0e10" strokeWidth="1.5">
              <line x1="135" y1="39" x2="135" y2="55" />
              <line x1="150" y1="39" x2="150" y2="55" />
              <line x1="190" y1="39" x2="190" y2="55" />
              <line x1="205" y1="39" x2="205" y2="55" />
            </g>

            {/* 5 ANILLOS / AROS DE REFUERZO HORIZONTALES (Grooves/Ribs característicos) */}
            {[170, 215, 260, 305, 350].map((y) => (
              <g key={y}>
                {/* Ranura hundida oscura */}
                <rect x="50" y={y - 2} width="240" height="7" fill="#0d0e10" />
                {/* Borde superior con brillo especular de plástico */}
                <line x1="50" y1={y - 2} x2="290" y2={y - 2} stroke="#3b3e46" strokeWidth="1.2" />
                {/* Borde inferior de la ranura */}
                <line x1="50" y1={y + 5} x2="290" y2={y + 5} stroke="#090a0c" strokeWidth="1.5" />
              </g>
            ))}

            {/* VÁLVULA DE SALIDA INFERIOR DE BRONCE/LATÓN (En la esquina inferior derecha) */}
            <g id="valvula-salida">
              {/* Brida de polietileno negro empotrada */}
              <ellipse cx="270" cy="372" rx="12" ry="14" fill="#0d0e11" stroke="#000000" strokeWidth="1.5" />
              <circle cx="270" cy="372" r="9" fill="#1c1e23" />

              {/* Niple roscado de latón que sobresale */}
              <rect x="275" y="365" width="20" height="14" rx="2" fill="url(#brassGrad)" stroke="#78350f" strokeWidth="0.8" />
              {/* Roscas doradas */}
              <g stroke="#713f12" strokeWidth="1.2">
                <line x1="279" y1="365" x2="279" y2="379" />
                <line x1="283" y1="365" x2="283" y2="379" />
                <line x1="287" y1="365" x2="287" y2="379" />
                <line x1="291" y1="365" x2="291" y2="379" />
              </g>
              {/* Borde / tuerca hexagonal exterior de latón */}
              <rect x="292" y="363" width="5" height="18" rx="1.5" fill="#facc15" stroke="#854d0e" strokeWidth="1" />
              {/* Orificio interior oscuro de la salida */}
              <ellipse cx="297" cy="372" rx="2" ry="6.5" fill="#1e1102" stroke="#ca8a04" strokeWidth="0.6" />
            </g>

            {/* ============================================================== */}
            {/* VISOR CENTRAL DE INSPECCIÓN DE NIVEL DE AGUA                   */}
            {/* ============================================================== */}
            <g id="visor-nivel">
              {/* Marco y fondo del visor de cristal templado */}
              <rect
                x="122"
                y="125"
                width="96"
                height="270"
                rx="8"
                fill="#0f172a"
                fillOpacity="0.85"
                stroke="#334155"
                strokeWidth="2"
              />

              {/* Zona mínima del tubo de salida (Zona no útil debajo del tubo) */}
              <rect
                x="123"
                y={tuboY}
                width="94"
                height={tankBottomY - tuboY}
                fill="#334155"
                fillOpacity="0.35"
              />
              {/* Línea divisoria de la salida mínima */}
              <line
                x1="123"
                y1={tuboY}
                x2="217"
                y2={tuboY}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* FLUIDO DE AGUA */}
              {nivelClamped > 0 && (
                <g clipPath="url(#visorClip)">
                  <clipPath id="visorClip">
                    <rect x="123" y="126" width="94" height="268" rx="7" />
                  </clipPath>

                  {/* Cuerpo del líquido con gradiente dinámico */}
                  <rect
                    x="123"
                    y={waterTopY}
                    width="94"
                    height={waterHeightPx}
                    fill="url(#waterGrad)"
                    style={{ transition: 'y 0.6s ease, height 0.6s ease' }}
                  />

                  {/* Onda / Menisco de la superficie del agua */}
                  <ellipse
                    cx="170"
                    cy={waterTopY}
                    rx="47"
                    ry="5"
                    fill={colorGradienteAguaInicio}
                    fillOpacity="0.8"
                    style={{ transition: 'cy 0.6s ease' }}
                  />
                  <ellipse
                    cx="170"
                    cy={waterTopY}
                    rx="40"
                    ry="2.5"
                    fill="#ffffff"
                    fillOpacity="0.5"
                    style={{ transition: 'cy 0.6s ease' }}
                  />
                </g>
              )}

              {/* Reflejo vertical de cristal sobre el visor */}
              <rect
                x="123"
                y="126"
                width="94"
                height="268"
                rx="7"
                fill="url(#glassReflection)"
                pointerEvents="none"
              />

              {/* Continuación sutil de las costillas del tanque a través del visor */}
              {[170, 215, 260, 305, 350].map((y) => (
                <line
                  key={`visor-rib-${y}`}
                  x1="123"
                  y1={y + 1}
                  x2="217"
                  y2={y + 1}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeOpacity="0.15"
                />
              ))}

              {/* ESCALA DE GRADUACIÓN NUMÉRICA (% Y TICAS) */}
              {[100, 75, 50, 25, 0].map((pct) => {
                const tickY = tankBottomY - (pct / 100) * tankHeight;
                return (
                  <g key={`tick-${pct}`}>
                    <line
                      x1="123"
                      y1={tickY}
                      x2="133"
                      y2={tickY}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeOpacity="0.75"
                    />
                    <text
                      x="137"
                      y={tickY + 3.5}
                      fill="#ffffff"
                      fillOpacity="0.9"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="Roboto, sans-serif"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* ETIQUETA DE SALIDA MÍNIMA DE AGUA */}
              <g>
                <text
                  x="212"
                  y={tuboY - 5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="Roboto, sans-serif"
                >
                  Salida ({alturaTuboDesdeBase} cm)
                </text>
              </g>
            </g>

            {/* SENSOR ULTRASÓNICO EN LA TAPA SUPERIOR */}
            <g id="sensor-ultrasonico">
              <rect
                x="154"
                y="20"
                width="32"
                height="16"
                rx="4"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="1.5"
              />
              {/* Transductores cilíndricos del sensor */}
              <circle cx="162" cy="28" r="4" fill="#0284c7" />
              <circle cx="178" cy="28" r="4" fill="#0284c7" />
              <circle cx="162" cy="28" r="1.5" fill="#ffffff" />
              <circle cx="178" cy="28" r="1.5" fill="#ffffff" />

              {/* Ondas ultrasónicas tenues hacia el agua */}
              <path
                d="M 160 48 Q 170 54 180 48"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeOpacity="0.7"
              />
              <path
                d="M 155 56 Q 170 63 185 56"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeOpacity="0.5"
              />
            </g>

            {/* Etiqueta flotante con el nivel actual sobre el visor */}
            <g transform={`translate(170, ${Math.min(tankBottomY - 24, Math.max(tankTopY + 24, waterTopY))})`}>
              <rect
                x="-36"
                y="-13"
                width="72"
                height="24"
                rx="12"
                fill="#0f172a"
                fillOpacity="0.92"
                stroke={colorPrimario}
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="700"
                fontFamily="Roboto, sans-serif"
              >
                {nivelClamped}%
              </text>
            </g>
          </svg>
        </div>

        {/* Resumen de Capacidad bajo el tanque */}
        <div style={styles.resumenTanque}>
          <div style={styles.resumenItem}>
            <span style={styles.resumenLabel}>Volumen Actual</span>
            <span style={styles.resumenValor}>
              {litrosTotales.toLocaleString()} <span style={styles.resumenUnidad}>L</span>
            </span>
          </div>
          <div style={styles.resumenDivisor} />
          <div style={styles.resumenItem}>
            <span style={styles.resumenLabel}>Volumen Útil</span>
            <span style={{ ...styles.resumenValor, color: porcentajeUtil < 20 ? '#ef4444' : '#0284c7' }}>
              {litrosUtiles.toLocaleString()} <span style={styles.resumenUnidad}>L</span>
            </span>
          </div>
          <div style={styles.resumenDivisor} />
          <div style={styles.resumenItem}>
            <span style={styles.resumenLabel}>Capacidad Total</span>
            <span style={styles.resumenValor}>
              {capacidadLitros.toLocaleString()} <span style={styles.resumenUnidad}>L</span>
            </span>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Tarjetas de Métricas Clave e Historial */}
      <div style={styles.metricasColumna}>
        {/* Grid de 4 tarjetas de medición profesional */}
        <div style={styles.gridTarjetas} className="smartturril-grid-tarjetas">
          {/* Tarjeta 1: Nivel de Llenado Total */}
          <div style={styles.tarjetaMetrica}>
            <div style={styles.tarjetaHeader}>
              <span style={styles.tarjetaEtiqueta}>Nivel de Llenado</span>
              <div style={{ ...styles.tarjetaIcono, backgroundColor: '#f0f9ff', color: '#0284c7' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
            </div>
            <div style={styles.tarjetaValorWrapper}>
              <span style={{ ...styles.tarjetaValor, color: colorPrimario }}>
                {nivelClamped}
              </span>
              <span style={styles.tarjetaUnidad}>%</span>
            </div>
            {/* Barra de progreso sutil */}
            <div style={styles.tarjetaBarraFondo}>
              <div style={{ ...styles.tarjetaBarraProgreso, width: `${nivelClamped}%`, backgroundColor: colorPrimario }} />
            </div>
            <span style={styles.tarjetaSubinfo}>Rango nominal: 0 - 100%</span>
          </div>

          {/* Tarjeta 2: Nivel Útil (Sobre el tubo de salida) */}
          <div style={styles.tarjetaMetrica}>
            <div style={styles.tarjetaHeader}>
              <span style={styles.tarjetaEtiqueta}>Nivel Útil Real</span>
              <div style={{ ...styles.tarjetaIcono, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </div>
            <div style={styles.tarjetaValorWrapper}>
              <span style={{ ...styles.tarjetaValor, color: porcentajeUtil < 20 ? '#ef4444' : '#16a34a' }}>
                {porcentajeUtil.toFixed(1)}
              </span>
              <span style={styles.tarjetaUnidad}>%</span>
            </div>
            <div style={styles.tarjetaBarraFondo}>
              <div style={{ ...styles.tarjetaBarraProgreso, width: `${porcentajeUtil}%`, backgroundColor: porcentajeUtil < 20 ? '#ef4444' : '#16a34a' }} />
            </div>
            <span style={styles.tarjetaSubinfo}>Sobre toma de agua ({alturaTuboDesdeBase} cm)</span>
          </div>

          {/* Tarjeta 3: Distancia al Agua (Lectura directa del Sensor) */}
          <div style={styles.tarjetaMetrica}>
            <div style={styles.tarjetaHeader}>
              <span style={styles.tarjetaEtiqueta}>Distancia al Agua</span>
              <div style={{ ...styles.tarjetaIcono, backgroundColor: '#faf5ff', color: '#9333ea' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div style={styles.tarjetaValorWrapper}>
              <span style={{ ...styles.tarjetaValor, color: '#0f172a' }}>
                {distanciaActual.toFixed(1)}
              </span>
              <span style={styles.tarjetaUnidad}>cm</span>
            </div>
            <div style={styles.tarjetaBarraFondo}>
              <div style={{
                ...styles.tarjetaBarraProgreso,
                width: `${Math.min(100, (distanciaActual / distanciaVacio) * 100)}%`,
                backgroundColor: '#9333ea'
              }} />
            </div>
            <span style={styles.tarjetaSubinfo}>Sensor a superficie libre</span>
          </div>

          {/* Tarjeta 4: Altura de la Columna de Agua */}
          <div style={styles.tarjetaMetrica}>
            <div style={styles.tarjetaHeader}>
              <span style={styles.tarjetaEtiqueta}>Altura de Agua</span>
              <div style={{ ...styles.tarjetaIcono, backgroundColor: '#ecfdf5', color: '#059669' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </div>
            </div>
            <div style={styles.tarjetaValorWrapper}>
              <span style={{ ...styles.tarjetaValor, color: '#0f172a' }}>
                {alturaAguaDesdeBase.toFixed(1)}
              </span>
              <span style={styles.tarjetaUnidad}>cm</span>
            </div>
            <div style={styles.tarjetaBarraFondo}>
              <div style={{
                ...styles.tarjetaBarraProgreso,
                width: `${Math.min(100, (alturaAguaDesdeBase / distanciaVacio) * 100)}%`,
                backgroundColor: '#059669'
              }} />
            </div>
            <span style={styles.tarjetaSubinfo}>Desde el fondo ({distanciaVacio} cm máx)</span>
          </div>
        </div>

        {/* Gráfico de Historial y Tendencia */}
        <div style={styles.graficoCard}>
          <div style={styles.graficoHeader}>
            <div>
              <h3 style={styles.graficoTitulo}>Tendencia de Nivel</h3>
              <p style={styles.graficoSubtitulo}>Monitoreo continuo en vivo</p>
            </div>
            <div style={styles.controlesGrafico}>
              <button
                style={{ ...styles.btnFiltro, ...(filtroTiempo === 'real' ? styles.btnFiltroActivo : {}) }}
                onClick={() => setFiltroTiempo('real')}
              >
                Tiempo real
              </button>
              <button
                style={{ ...styles.btnFiltro, ...(filtroTiempo === '1h' ? styles.btnFiltroActivo : {}) }}
                onClick={() => setFiltroTiempo('1h')}
              >
                1h
              </button>
              <button
                style={{ ...styles.btnFiltro, ...(filtroTiempo === '24h' ? styles.btnFiltroActivo : {}) }}
                onClick={() => setFiltroTiempo('24h')}
              >
                24h
              </button>
            </div>
          </div>

          <div style={styles.svgGraficoContainer}>
            <svg viewBox="0 0 500 120" preserveAspectRatio="none" style={styles.svgGrafico}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colorPrimario} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={colorPrimario} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Líneas horizontales de guía */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />

              {/* Guía de Alerta Crítica (Línea roja discontinua a 20%) */}
              <line
                x1="0"
                y1={120 - (criticoBajo / 100) * 120}
                x2="500"
                y2={120 - (criticoBajo / 100) * 120}
                stroke="#fca5a5"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {historial.length > 1 && (
                <>
                  {/* Área sombreada bajo la curva */}
                  <path
                    d={`M 0 120 L ${historial
                      .map((p, i) => `${(i / (historial.length - 1)) * 500} ${120 - (p.nivel / 100) * 100 - 10}`)
                      .join(' L ')} L 500 120 Z`}
                    fill="url(#chartGradient)"
                  />
                  {/* Línea del gráfico */}
                  <path
                    d={`M ${historial
                      .map((p, i) => `${(i / (historial.length - 1)) * 500} ${120 - (p.nivel / 100) * 100 - 10}`)
                      .join(' L ')}`}
                    fill="none"
                    stroke={colorPrimario}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </div>

          <div style={styles.graficoFooter}>
            <div style={styles.leyendaItem}>
              <span style={{ ...styles.leyendaDot, backgroundColor: colorPrimario }} />
              <span>Nivel actual: <strong>{nivelClamped}%</strong></span>
            </div>
            <div style={styles.leyendaItem}>
              <span style={{ ...styles.leyendaDot, backgroundColor: '#f87171' }} />
              <span>Umbral Crítico: <strong>{criticoBajo}%</strong></span>
            </div>
            <div style={styles.leyendaItem}>
              <span style={{ ...styles.leyendaDot, backgroundColor: '#fbbf24' }} />
              <span>Riesgo Desborde: <strong>{criticoAlto}%</strong></span>
            </div>
          </div>
        </div>

        {/* Ficha técnica del equipo */}
        <div style={styles.fichaTecnica} className="smartturril-ficha-tecnica">
          <div style={styles.fichaItem}>
            <span style={styles.fichaLabel}>Sensor Instalado</span>
            <span style={styles.fichaValor}>Ultrasónico HC-SR04</span>
          </div>
          <div style={styles.fichaItem}>
            <span style={styles.fichaLabel}>Fondo Calibrado</span>
            <span style={styles.fichaValor}>{distanciaVacio} cm</span>
          </div>
          <div style={styles.fichaItem}>
            <span style={styles.fichaLabel}>Margen Superior</span>
            <span style={styles.fichaValor}>{distanciaLleno} cm</span>
          </div>
          <div style={styles.fichaItem}>
            <span style={styles.fichaLabel}>Toma de Salida</span>
            <span style={styles.fichaValor}>+{alturaTuboDesdeBase} cm base</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .smartturril-dashboard-container {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .smartturril-grid-tarjetas {
            grid-template-columns: 1fr !important;
          }
          .smartturril-ficha-tecnica {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  dashboardContainer: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 400px) minmax(360px, 1fr)',
    gap: '24px',
    maxWidth: '1180px',
    margin: '0 auto',
    alignItems: 'start',
  },
  tanqueCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  cardHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  headerTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardSubtitle: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  badgeEstado: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  tanqueSvgWrapper: {
    width: '100%',
    maxWidth: '340px',
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 0',
  },
  tanqueSvg: {
    width: '100%',
    height: 'auto',
    maxHeight: '380px',
    filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.06))',
  },
  resumenTanque: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '12px 16px',
    marginTop: '16px',
  },
  resumenItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  resumenLabel: {
    fontSize: '0.725rem',
    color: '#64748b',
    fontWeight: '500',
    marginBottom: '2px',
  },
  resumenValor: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  resumenUnidad: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#64748b',
  },
  resumenDivisor: {
    width: '1px',
    height: '24px',
    backgroundColor: '#e2e8f0',
  },
  metricasColumna: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  gridTarjetas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  tarjetaMetrica: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '18px',
    boxShadow: '0 2px 8px -1px rgba(15, 23, 42, 0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  tarjetaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  tarjetaEtiqueta: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
  },
  tarjetaIcono: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaValorWrapper: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    margin: '4px 0 8px 0',
  },
  tarjetaValor: {
    fontSize: '1.85rem',
    fontWeight: '700',
    lineHeight: 1,
  },
  tarjetaUnidad: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#94a3b8',
  },
  tarjetaBarraFondo: {
    width: '100%',
    height: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  tarjetaBarraProgreso: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.6s ease',
  },
  tarjetaSubinfo: {
    fontSize: '0.725rem',
    color: '#94a3b8',
    fontWeight: '400',
  },
  graficoCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 2px 10px -2px rgba(15, 23, 42, 0.04)',
  },
  graficoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  graficoTitulo: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  graficoSubtitulo: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: '2px 0 0 0',
  },
  controlesGrafico: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#f8fafc',
    padding: '3px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  btnFiltro: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnFiltroActivo: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  svgGraficoContainer: {
    width: '100%',
    height: '110px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
    padding: '4px',
  },
  svgGrafico: {
    width: '100%',
    height: '100%',
  },
  graficoFooter: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  leyendaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  leyendaDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  fichaTecnica: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '14px 16px',
  },
  fichaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  fichaLabel: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  fichaValor: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#334155',
  },
};