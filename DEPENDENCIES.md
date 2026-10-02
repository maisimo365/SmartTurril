# SmartTurril - Dependencias del Proyecto

Documento de referencia con todas las dependencias, herramientas y versiones utilizadas en cada modulo del monorepo.

---

## Requisitos del Sistema

| Herramienta | Version minima | Proposito |
|-------------|---------------|-----------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | 24.x | Contenedor del broker Mosquitto |
| [Node.js](https://nodejs.org/) | 18.x LTS | Runtime del proyecto web |
| npm | 9.x | Gestor de paquetes del proyecto web |
| [Arduino IDE](https://www.arduino.cc/en/software) | 2.x | Compilacion y flasheo del firmware ESP32 |
| ESP32 Board Support Package | 2.x | Soporte para placas ESP32 en Arduino IDE |

---

## Modulo: `/firmware` (Arduino / C++)

Instalar desde el **Library Manager** del Arduino IDE (`Sketch > Include Library > Manage Libraries`):

| Libreria | Version recomendada | Autor | Proposito |
|---------|-------------------|-------|-----------|
| `PubSubClient` | 2.8.0+ | Nick O'Leary | Cliente MQTT para ESP32 |
| `ArduinoJson` | 6.x | Benoit Blanchon | Serializacion/deserializacion JSON |
| `WiFi` | (incluida en ESP32 BSP) | Espressif | Conectividad Wi-Fi |
| `esp_sleep.h` | (incluida en ESP32 BSP) | Espressif | Control del modo Deep Sleep |

### Instalacion del soporte ESP32 en Arduino IDE

1. Ir a `File > Preferences`
2. En *Additional boards manager URLs*, agregar:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Ir a `Tools > Board > Boards Manager`, buscar `esp32` e instalar el paquete de **Espressif Systems**

---

## Modulo: `/infra` (Docker)

| Imagen | Version | Puerto | Proposito |
|--------|---------|--------|-----------|
| `eclipse-mosquitto` | `2.0` | 1883 (TCP MQTT) / 9001 (WebSocket) | Broker MQTT central |

### Comandos de instalacion

```bash
# No requiere instalacion previa, Docker descarga la imagen automaticamente
cd SmartTurril/infra
docker compose up -d
```

---

## Modulo: `/web` (Next.js)

### Dependencias de produccion (`dependencies`)

| Paquete | Version instalada | Proposito |
|---------|------------------|-----------|
| `next` | 15.x | Framework React con App Router |
| `react` | 19.x | Libreria UI |
| `react-dom` | 19.x | Renderizado del DOM |
| `mqtt` | 5.x | Cliente MQTT via WebSockets para el navegador |

### Dependencias de desarrollo (`devDependencies`)

| Paquete | Version instalada | Proposito |
|---------|------------------|-----------|
| `typescript` | 5.x | Tipado estatico |
| `@types/node` | 22.x | Tipos de Node.js |
| `@types/react` | 19.x | Tipos de React |
| `@types/react-dom` | 19.x | Tipos de React DOM |
| `tailwindcss` | 4.x | Framework CSS utilitario |
| `@tailwindcss/postcss` | 4.x | Plugin PostCSS para Tailwind |
| `eslint` | 9.x | Linter de codigo |
| `eslint-config-next` | 15.x | Reglas ESLint para Next.js |

### Comandos de instalacion

```bash
cd SmartTurril/web

# Instalar todas las dependencias del proyecto
npm install

# Agregar la libreria MQTT (ya incluida, solo como referencia)
npm install mqtt

# Iniciar servidor de desarrollo
npm run dev
```

---

## Conexiones entre modulos

```
ESP32 (PubSubClient)
    |
    | MQTT TCP - puerto 1883
    v
Eclipse Mosquitto (Docker)
    |
    | MQTT WebSocket - puerto 9001
    v
Next.js Dashboard (libreria mqtt / browser)
```

---

## Notas de desarrollo

- El broker Mosquitto tiene `allow_anonymous true` **solo para desarrollo**. En produccion se debe configurar autenticacion con usuario y contrasena.
- La libreria `mqtt` de npm funciona en el navegador via WebSockets (no requiere Node.js en cliente).
- El ESP32 usa **Deep Sleep** de 5 minutos entre mediciones; el broker conserva el ultimo mensaje con `retain=true`.
