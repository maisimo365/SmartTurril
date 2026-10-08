#include <WiFi.h>
#include <PubSubClient.h>

// !!! CAMBIAR ESTOS VALORES LOCALMENTE !!!
// No subir a Git ni compartir estas credenciales.
const char* ssid = ""; //tu red wifi
const char* password = ""; // tu contraseña de tu red wifi
const char* mqtt_server = ""; // IP del VPS

WiFiClient espClient;
PubSubClient client(espClient);

// Configuracion Deep Sleep (5 minutos)
#define uS_TO_S_FACTOR 1000000ULL
#define TIME_TO_SLEEP  300

void setup_wifi() {
  Serial.print("\nConectando a ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado! IP: " + WiFi.localIP().toString());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Intentando conexion MQTT...");
    if (client.connect("ESP32_SmartTurril")) {
      Serial.println("Conectado al broker MQTT!");
    } else {
      Serial.print("Fallo, rc=");
      Serial.print(client.state());
      Serial.println(" Intentando de nuevo en 5 segundos...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  setup_wifi();
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Simulacion de lectura del nivel para probar la conectividad
  String payload = "{\"nivel\": 85}";
  String topic = "smartturril/tanque01/nivel";
  
  Serial.print("Publicando en " + topic + ": ");
  Serial.println(payload);
  
  // Publicar el mensaje
  client.publish(topic.c_str(), payload.c_str());

  // Mandar el ESP32 a dormir
  Serial.println("Entrando en Deep Sleep por 5 minutos...");
  Serial.flush();
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
  esp_deep_sleep_start();
}
