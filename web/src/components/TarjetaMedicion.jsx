'use client';

export default function TarjetaMedicion({ valor, maximo, color, etiqueta, unidad = 'cm' }) {
  const porcentaje = Math.min((valor / maximo) * 100, 100);
  const valorMostrar = typeof valor === 'number' 
    ? (valor % 1 === 0 ? valor : valor.toFixed(1)) 
    : valor;

  return (
    <div style={styles.tarjeta}>
      <div style={styles.header}>
        <span style={styles.etiqueta}>{etiqueta}</span>
        <span style={{...styles.valor, color: color}}>
          {valorMostrar} <span style={styles.unidad}>{unidad}</span>
        </span>
      </div>
      {/* Barra de progreso lineal */}
      <div style={styles.barraFondo}>
        <div 
          style={{
            ...styles.barraProgreso,
            width: `${porcentaje}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div style={styles.maximo}>
        <span>Máx: {maximo} {unidad}</span>
      </div>
    </div>
  );
}

const styles = {
  tarjeta: {
    flex: 1,
    minWidth: '140px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '12px',
  },
  etiqueta: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  valor: {
    fontSize: '1.75rem',
    fontWeight: '800',
  },
  unidad: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#94a3b8',
  },
  barraFondo: {
    width: '100%',
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  barraProgreso: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.8s ease, background-color 0.5s ease',
  },
  maximo: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textAlign: 'right',
  },
};