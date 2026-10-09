'use client';

export default function CirculoProgreso({ valor, maximo = 100, color, etiqueta, unidad = '%' }) {
  // Calcular el porcentaje relativo al máximo
  const porcentaje = Math.min((valor / maximo) * 100, 100);
  
  // Configuración del círculo SVG
  const radio = 45;
  const circunferencia = 2 * Math.PI * radio; // ~282.74
  const offset = circunferencia - (porcentaje / 100) * circunferencia;

  // Formatear el valor para mostrar
  const valorMostrar = typeof valor === 'number' 
    ? (valor % 1 === 0 ? valor : valor.toFixed(1)) 
    : valor;

  return (
    <div style={styles.contenedor}>
      <div style={styles.circuloContainer}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Círculo de fondo (gris) */}
          <circle
            cx="60"
            cy="60"
            r={radio}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          {/* Círculo de progreso (color dinámico) */}
          <circle
            cx="60"
            cy="60"
            r={radio}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{
              transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
            }}
          />
          {/* Texto del valor en el centro */}
          <text
            x="60"
            y="58"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: '22px',
              fontWeight: '800',
              fill: color,
            }}
          >
            {valorMostrar}
          </text>
          {/* Unidad pequeña debajo del número */}
          <text
            x="60"
            y="78"
            textAnchor="middle"
            style={{
              fontSize: '11px',
              fontWeight: '600',
              fill: '#64748b',
            }}
          >
            {unidad}
          </text>
        </svg>
      </div>
      {/* Etiqueta debajo del círculo */}
      <p style={styles.etiqueta}>{etiqueta}</p>
    </div>
  );
}

const styles = {
  contenedor: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: '120px',
  },
  circuloContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  etiqueta: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
};