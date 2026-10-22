#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// 1. Configuración de Pines del Sensor HC-SR04
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// 2. Calibración del Tanque (en centímetros)
//    Ajusta estos valores según tu tanque físico
const float DISTANCIA_VACIO_CM = 100.0;  // Distancia cuando el tanque está vacío
const float DISTANCIA_LLENO_CM = 2.0;   // Distancia cuando el tanque está lleno

// ============================================================
// 3. Credenciales de Red y Broker MQTT (AWS)
//    *** CAMBIA ESTOS VALORES A TU RED REAL ***
// ============================================================
const char* WIFI_SSID     = "NOMBRE_DE_TU_HOTSPOT";  // Ej: "Mi Red"
const char* WIFI_PASSWORD = "CLAVE_DE_TU_HOTSPOT";   // Contraseña del hotspot
const char* MQTT_BROKER   = "3.133.150.226";          // IP pública de tu servidor AWS
const int   MQTT_PORT     = 1883;
const char* MQTT_TOPIC    = "smartturril/tanque01/nivel";

WiFiClient espClient;
PubSubClient client(espClient);

// Función para conectar a la red WiFi
void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    intentos++;
    if (intentos > 40) {  // 20 segundos de timeout
      Serial.println("\n[ERROR] No se pudo conectar al WiFi. Reiniciando...");
      ESP.restart();
    }
  }

  Serial.println("\n¡WiFi Conectado con exito!");
  Serial.print("IP asignada: ");
  Serial.println(WiFi.localIP());
  Serial.print("Signal (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

// Función para conectar o reconectar al servidor MQTT
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando al Broker MQTT en AWS (");
    Serial.print(MQTT_BROKER);
    Serial.print(")... ");

    // Crear un ID de cliente único usando la MAC del ESP32
    String clientId = "ESP32_SmartTurril_";
    clientId += WiFi.macAddress();
    clientId.replace(":", "");

    if (client.connect(clientId.c_str())) {
      Serial.println("¡CONECTADO al broker MQTT!");
    } else {
      Serial.print("[ERROR] rc=");
      Serial.print(client.state());
      Serial.println(" | Reintentando en 5 segundos...");
      delay(5000);
    }
  }
}

// Función para medir distancia con el sensor HC-SR04
float medirDistancia() {
  // Asegurar LOW antes de disparar
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(5);

  // Pulso de disparo de 10 microsegundos
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Esperar el eco (timeout 30ms ≈ 5 metros max)
  unsigned long duracion = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duracion == 0) {
    return -1.0;  // Sin eco = objeto fuera de rango
  }

  // distancia = (duracion * 0.0343 cm/µs) / 2
  return duracion * 0.0343 / 2.0;
}

// Función para calcular porcentaje de llenado
int calcularNivel(float distancia) {
  float porcentaje = (DISTANCIA_VACIO_CM - distancia) / (DISTANCIA_VACIO_CM - DISTANCIA_LLENO_CM) * 100.0;
  porcentaje = constrain(porcentaje, 0.0, 100.0);
  return (int)round(porcentaje);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("======================================");
  Serial.println("  SmartTurril - Hardware Real v1.0   ");
  Serial.println("======================================");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  setupWiFi();

  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setKeepAlive(60);

  Serial.println("Sistema listo. Iniciando monitoreo...\n");
}

void loop() {
  // Mantener conexión MQTT activa
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  float distancia = medirDistancia();

  if (distancia < 0) {
    Serial.println("[SENSOR] Error: No se recibio eco. Verifica el cableado.");
  } else {
    int nivel = calcularNivel(distancia);

    // ==============================================================
    // HU 5 - Fase 1: Payload con distancia BRUTA en cm
    // Formato: {"distancia_cm": 12.3, "nivel": 88}
    // ==============================================================
    String payload = "{\"distancia_cm\":" + String(distancia, 1) +
                     ",\"nivel\":" + String(nivel) + "}";

    Serial.print("[SENSOR] Distancia: ");
    Serial.print(distancia, 1);
    Serial.print(" cm | Nivel: ");
    Serial.print(nivel);
    Serial.print("% | Payload: ");
    Serial.println(payload);

    // Publicar al broker MQTT en AWS
    bool ok = client.publish(MQTT_TOPIC, payload.c_str());
    if (ok) {
      Serial.println("[MQTT]   Publicado en AWS OK");
    } else {
      Serial.println("[MQTT]   Error al publicar. Reconectando...");
    }
  }

  Serial.println("---");
  delay(3000);  // Publica cada 3 segundos
}