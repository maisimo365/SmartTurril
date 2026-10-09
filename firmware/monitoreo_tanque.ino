#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// 1. Configuración de Pines del Sensor HC-SR04
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

// 2. Calibración del Tanque (en centímetros)
const float DISTANCIA_VACIO_CM = 100.0;
const float DISTANCIA_LLENO_CM = 2.0;

// 3. Credenciales de Red y Broker MQTT (AWS)
const char* WIFI_SSID     = "Wokwi-GUEST";   // WiFi virtual de Wokwi
const char* WIFI_PASSWORD = "";              // Sin contraseña
const char* MQTT_BROKER   = "3.133.150.226"; // IP pública de tu servidor AWS
const int   MQTT_PORT     = 1883;            // Puerto MQTT estándar
const char* MQTT_TOPIC    = "smartturril/tanque01/nivel";

WiFiClient espClient;
PubSubClient client(espClient);

// Función para conectar a la red WiFi
void setupWiFi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n¡WiFi Conectado con éxito!");
  Serial.print("IP asignada: ");
  Serial.println(WiFi.localIP());
}

// Función para conectar o reconectar al servidor MQTT
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando al Broker MQTT en AWS (");
    Serial.print(MQTT_BROKER);
    Serial.print(")... ");
    
    // Crear un ID de cliente único
    String clientId = "ESP32_SmartTurril_";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("¡CONECTADO!");
    } else {
      Serial.print("Error, rc=");
      Serial.print(client.state());
      Serial.println(" Reintentando en 5 segundos...");
      delay(5000);
    }
  }
}

// Función para medir distancia con el sensor HC-SR04
float medirDistancia() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duracion = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duracion == 0) {
    return -1;
  }

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

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  digitalWrite(TRIG_PIN, LOW);

  setupWiFi();
  client.setServer(MQTT_BROKER, MQTT_PORT);

  Serial.println("SmartTurril - Sistema de Monitoreo Iniciado");
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  float distancia = medirDistancia();

  if (distancia < 0) {
    Serial.println("Error: No se recibió eco del sensor.");
  } else {
    int nivel = calcularNivel(distancia);

    // Formatear mensaje JSON: {"nivel": 85}
    String payload = "{\"nivel\":" + String(nivel) + "}";

    Serial.print("Distancia: ");
    Serial.print(distancia, 1);
    Serial.print(" cm | Nivel: ");
    Serial.print(nivel);
    Serial.print("% | Publicando a AWS: ");
    Serial.println(payload);

    // Enviar mensaje al tópico MQTT
    client.publish(MQTT_TOPIC, payload.c_str());
  }

  delay(3000); // Envía un dato cada 3 segundos
}