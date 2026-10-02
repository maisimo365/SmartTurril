# SmartTurril

<div align="center">
  <img src="https://img.shields.io/badge/ESP32-Firmware-blue?style=for-the-badge&logo=espressif" />
  <img src="https://img.shields.io/badge/MQTT-Mosquitto-orange?style=for-the-badge&logo=eclipse-mosquitto" />
  <img src="https://img.shields.io/badge/Next.js-Dashboard-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Docker-Infraestructura-2496ED?style=for-the-badge&logo=docker" />
</div>

> **SmartTurril** es un sistema IoT para monitorear en tiempo real el nivel de agua de un tanque residencial, desarrollado como proyecto para la asignatura de **Servicios Telematicos**.

---

## Arquitectura del Sistema

El sistema sigue un modelo de tres capas clasico para aplicaciones IoT:

`
+------------------+     MQTT (TCP)      +------------------+     WebSocket     +------------------+
|                  |   ─────────────►   |                  |   ─────────────►  |                  |
|   PERCEPCION     |   puerto 1883       |   RED / CLOUD    |   puerto 9001     |   APLICACION     |
|                  |                    |                   |                   |                  |
|   ESP32 +        |                    |  Eclipse          |                   |  Next.js         |
|   HC-SR04        |                    |  Mosquitto        |                   |  Dashboard       |
|   (Sensor        |                    |  (Broker MQTT)    |                   |  (React + MQTT   |
|   Ultrasonico)   |                    |  [Docker]         |                   |   WebSocket)     |
+------------------+                    +------------------+                    +------------------+
     Topico: smartturril/tanque01/nivel
`

### Descripcion de capas

| Capa | Componente | Rol |
|------|-----------|-----|
| **Percepcion** | ESP32 + HC-SR04 | Mide la distancia al agua, calcula el porcentaje de llenado y publica cada 5 minutos via MQTT. Usa Deep Sleep para ahorrar bateria. |
| **Red / Cloud** | Eclipse Mosquitto | Broker MQTT central. Recibe mensajes del ESP32 por TCP (puerto 1883) y los retransmite al navegador por WebSockets (puerto 9001). |
| **Aplicacion** | Next.js Dashboard | Interfaz web que se suscribe directamente al broker via WebSocket y muestra el nivel del tanque en tiempo real. |

---

## Estructura del Monorepo

`
SmartTurril/
|
+-- firmware/
|   +-- monitoreo_tanque.ino   # Codigo C++ para el ESP32
|
+-- infra/
|   +-- docker-compose.yml     # Orquestacion de servicios
|   +-- config/
|       +-- mosquitto.conf     # Configuracion del broker MQTT
|
+-- web/
|   +-- src/
|   |   +-- app/               # App Router de Next.js
|   |   +-- components/
|   |       +-- Dashboard.tsx  # Componente principal del dashboard
|   +-- package.json
|
+-- README.md                  # Este archivo
`

---

## Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado y en ejecucion
- [Node.js](https://nodejs.org/) v18+ y npm
- [Arduino IDE](https://www.arduino.cc/en/software) con soporte para ESP32

---

## Guia de Inicio Rapido

### Paso 1: Levantar la Infraestructura MQTT

`ash
# Navegar a la carpeta de infraestructura
cd infra

# Iniciar el broker Mosquitto en segundo plano
docker compose up -d

# Verificar que los contenedores esten corriendo
docker compose ps
`

Deberias ver el contenedor **smartturril-mosquitto** en estado Up.

Para verificar que el broker funciona correctamente:

`ash
# Ver los logs del broker en tiempo real
docker compose logs -f mosquitto
`

### Paso 2: Ejecutar el Dashboard Web

`ash
# Navegar a la carpeta web
cd web

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar el servidor de desarrollo
npm run dev
`

Abre tu navegador en [http://localhost:3000](http://localhost:3000).

### Paso 3: Programar el ESP32

1. Abre irmware/monitoreo_tanque.ino en el **Arduino IDE**
2. Instala las librerias necesarias desde el **Library Manager**:
   - PubSubClient by Nick O'Leary
   - ArduinoJson by Benoit Blanchon
3. Edita las credenciales en el archivo:
   `cpp
   const char* WIFI_SSID     = "TU_SSID";
   const char* WIFI_PASSWORD = "TU_PASSWORD";
   const char* MQTT_BROKER   = "192.168.1.100"; // IP de tu PC con Docker
   `
4. Conecta el sensor HC-SR04:
   - **Trigger** -> GPIO 5
   - **Echo**    -> GPIO 18
   - **VCC**     -> 5V
   - **GND**     -> GND
5. Selecciona tu placa **ESP32** y el puerto COM correcto
6. Carga el firmware

---

## Topicos MQTT

| Topico | Direccion | Formato | Ejemplo |
|--------|-----------|---------|---------|
| smartturril/tanque01/nivel | ESP32 → Broker → Dashboard | JSON | {"nivel": 85} |

---

## Comandos Utiles

`ash
# Publicar un mensaje de prueba manualmente (sin ESP32)
docker exec -it smartturril-mosquitto mosquitto_pub \
  -t smartturril/tanque01/nivel \
  -m '{"nivel": 75}'

# Suscribirse y escuchar mensajes desde la terminal
docker exec -it smartturril-mosquitto mosquitto_sub \
  -t smartturril/tanque01/nivel \
  -v

# Detener la infraestructura
cd infra && docker compose down
`

---

## Licencia

Proyecto academico - Servicios Telematicos - Universidad.
