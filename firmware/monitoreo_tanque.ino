/**
 * ============================================================
 *  SmartTurril - Firmware ESP32
 *  Monitoreo de nivel de agua en tanque residencial
 * ============================================================
 *  Autor      : Equipo SmartTurril - Servicios Telematicos
 *  Descripcion: Lee un sensor ultrasonico HC-SR04, calcula el
 *               porcentaje de llenado del tanque y publica
 *               el resultado en un broker MQTT en formato JSON.
 *               Despues de publicar, entra en Deep Sleep por
 *               5 minutos para ahorrar energia.
 * ============================================================
 *  Dependencias (instalar desde Arduino Library Manager):
 *    - PubSubClient  by Nick O'Leary  (v2.8+)
 *    - ArduinoJson   by Benoit Blanchon (v6+)
 * ============================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ----------------------------------------------------------
//  CONFIGURACION: Wi-Fi
// ----------------------------------------------------------
const char* WIFI_SSID     = "TU_SSID";
const char* WIFI_PASSWORD = "TU_PASSWORD";

// ----------------------------------------------------------
//  CONFIGURACION: Broker MQTT
// ----------------------------------------------------------
const char* MQTT_BROKER    = "192.168.1.100";
const int   MQTT_PORT      = 1883;
const char* MQTT_CLIENT_ID = "ESP32_Tanque01";
const char* MQTT_TOPIC     = "smartturril/tanque01/nivel";

// ----------------------------------------------------------
//  CONFIGURACION: Sensor Ultrasonico HC-SR04
// ----------------------------------------------------------
const int PIN_TRIGGER = 5;
const int PIN_ECHO    = 18;

// ----------------------------------------------------------
//  CONFIGURACION: Dimensiones fisicas del tanque (en cm)
// ----------------------------------------------------------
const float DISTANCIA_MIN_CM = 10.0;
const float DISTANCIA_MAX_CM = 155.0;

// ----------------------------------------------------------
//  CONFIGURACION: Deep Sleep (5 minutos)
// ----------------------------------------------------------
const uint64_t SLEEP_SEGUNDOS = 5 * 60;

WiFiClient   espClient;
PubSubClient mqttClient(espClient);

void entrarDeepSleep() {
  Serial.print("[SLEEP] Entrando en Deep Sleep por 5 minutos...\n");
  Serial.flush();
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  esp_sleep_enable_timer_wakeup(SLEEP_SEGUNDOS * 1000000ULL);
  esp_deep_sleep_start();
}

void conectarWifi() {
  Serial.print("[WiFi] Conectando a: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++intentos > 40) {
      Serial.println("\n[WiFi] FALLO - Reintentando en Deep Sleep...");
      entrarDeepSleep();
    }
  }
  Serial.print("\n[WiFi] IP: ");
  Serial.println(WiFi.localIP());
}

void conectarMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  int intentos = 0;
  while (!mqttClient.connected()) {
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      Serial.println("[MQTT] Conectado!");
    } else {
      Serial.print("[MQTT] Error: ");
      Serial.println(mqttClient.state());
      delay(2000);
      if (++intentos > 5) entrarDeepSleep();
    }
  }
}

float medirDistanciaCm() {
  digitalWrite(PIN_TRIGGER, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIGGER, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIGGER, LOW);
  long duracion = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duracion == 0) return -1.0;
  return (duracion * 0.0343) / 2.0;
}

int calcularNivelPorcentaje(float distancia) {
  if (distancia < 0) return -1;
  distancia = constrain(distancia, DISTANCIA_MIN_CM, DISTANCIA_MAX_CM);
  return (int)(((DISTANCIA_MAX_CM - distancia) / (DISTANCIA_MAX_CM - DISTANCIA_MIN_CM)) * 100.0);
}

void publicarNivel(int nivel) {
  StaticJsonDocument<64> doc;
  doc["nivel"] = nivel;
  char buffer[64];
  serializeJson(doc, buffer);
  Serial.print("[MQTT] Publicando: ");
  Serial.println(buffer);
  mqttClient.publish(MQTT_TOPIC, buffer, true);
}

void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n========================================");
  Serial.println("  SmartTurril - Monitor de Nivel Agua  ");
  Serial.println("========================================");

  pinMode(PIN_TRIGGER, OUTPUT);
  pinMode(PIN_ECHO, INPUT);

  conectarWifi();
  conectarMQTT();

  float suma = 0;
  int validas = 0;
  for (int i = 0; i < 3; i++) {
    float d = medirDistanciaCm();
    if (d > 0) { suma += d; validas++; }
    delay(100);
  }

  if (validas > 0) {
    float promedio = suma / validas;
    int nivel = calcularNivelPorcentaje(promedio);
    Serial.print("[SENSOR] Distancia: ");
    Serial.print(promedio);
    Serial.print(" cm | Nivel: ");
    Serial.print(nivel);
    Serial.println("%");
    publicarNivel(nivel);
  } else {
    Serial.println("[ERROR] Lectura invalida.");
  }

  mqttClient.loop();
  delay(500);
  entrarDeepSleep();
}

void loop() {
  // Intencionalmente vacio - Deep Sleep impide llegar aqui
}
