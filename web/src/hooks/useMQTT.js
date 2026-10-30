'use client';
import { useEffect, useState, useRef } from 'react';
import mqtt from 'mqtt';

export default function useMQTT() {
  const [nivel, setNivel] = useState(0);
  const [distanciaCm, setDistanciaCm] = useState(null);
  const [status, setStatus] = useState('Desconectado');
  const clientRef = useRef(null);

  useEffect(() => {
    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;
    const topic = process.env.NEXT_PUBLIC_MQTT_TOPIC;

    if (!brokerUrl || !topic) {
      console.warn('Faltan variables de entorno MQTT en .env.local');
      setStatus('Configuración incompleta');
      return;
    }

    const clientId = `dashboard_${Math.random().toString(16).substring(2, 8)}`;

    try {
      const client = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
      });

      clientRef.current = client;

      client.on('connect', () => {
        console.log('[MQTT] Conectado al broker');
        setStatus('Conectado');
        client.subscribe(topic, { qos: 0 }, (err) => {
          if (err) console.error('[MQTT] Error al suscribirse:', err);
        });
      });

      client.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
          try {
            const data = JSON.parse(message.toString());
            if (typeof data.nivel === 'number') {
              console.log('[MQTT] Nivel recibido:', data.nivel);
              setNivel(data.nivel);
            }
            if (typeof data.distancia_cm === 'number') {
              setDistanciaCm(data.distancia_cm);
            }
          } catch (e) {
            console.error('[MQTT] Error al parsear mensaje:', e);
          }
        }
      });

      client.on('error', (err) => {
        console.error('[MQTT] Error:', err);
        setStatus('Error de conexión');
      });

      client.on('offline', () => setStatus('Desconectado'));
      client.on('reconnect', () => setStatus('Reconectando'));

    } catch (error) {
      console.error('[MQTT] Error al crear cliente:', error);
      setStatus('Error inicializando');
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.end(true);
      }
    };
  }, []);

  return { nivel, distanciaCm, status };
}