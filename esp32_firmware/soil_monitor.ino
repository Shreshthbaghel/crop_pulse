/*
 * TerraSense ESP32 Soil Monitor Firmware
 * =======================================
 * Hardware:
 *   - Capacitive Moisture Sensor  → GPIO34 (ADC1)
 *   - DS18B20 Temperature Sensor  → GPIO4  (OneWire)
 *   - EC Sensor (analog)          → GPIO35 (ADC1)
 *   - Status LED (built-in)       → GPIO2
 *
 * Libraries required (install via Arduino Library Manager):
 *   - PubSubClient   by Nick O'Leary
 *   - DallasTemperature + OneWire by Miles Burton
 *   - ArduinoJson    by Benoit Blanchon
 *
 * Protocol: MQTT over WiFi → broker.hivemq.com:1883
 * Payload topic: soil/farm1/zone1
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// ── WiFi credentials ─────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ── MQTT broker ───────────────────────────────────────────────────────────
const char* MQTT_BROKER    = "broker.hivemq.com";
const int   MQTT_PORT      = 1883;
const char* MQTT_TOPIC     = "soil/farm1/zone1";
const char* DEVICE_ID      = "esp32_farm1_zone1";

// ── Pin definitions ───────────────────────────────────────────────────────
#define MOISTURE_PIN   34    // Capacitive sensor (ADC)
#define TEMP_PIN        4    // DS18B20 OneWire data
#define EC_PIN         35    // EC sensor (ADC)
#define LED_PIN         2    // Built-in LED

// ── Calibration constants (tune with your specific sensors) ──────────────
// Capacitive moisture: raw ADC 4095 = dry air (0%), ~1500 = saturated (100%)
const int MOISTURE_DRY  = 3800;   // ADC reading in dry air
const int MOISTURE_WET  = 1400;   // ADC reading fully submerged

// EC sensor: voltage-to-dS/m conversion factor (adjust for your circuit)
const float EC_VOLTAGE_REF    = 3.3f;   // ESP32 ADC reference
const float EC_CELL_CONSTANT  = 1.0f;   // cm-1 – sensor-specific

// ── Timing ────────────────────────────────────────────────────────────────
const unsigned long READ_INTERVAL_MS = 30000UL;  // 30 seconds

// ── Globals ───────────────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);
OneWire      oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

unsigned long lastReadTime = 0;
int reconnectAttempts = 0;

// ── LED helpers ───────────────────────────────────────────────────────────
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

// ── Sensor reading functions ──────────────────────────────────────────────
float readMoisturePct() {
  // Average 10 ADC samples to reduce noise
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(MOISTURE_PIN);
    delay(5);
  }
  float raw = sum / 10.0f;
  // Map and clamp to 0–100%
  float pct = map(raw, MOISTURE_DRY, MOISTURE_WET, 0, 100);
  return constrain(pct, 0.0f, 100.0f);
}

float readTemperatureC() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C || t < -50 || t > 85) {
    Serial.println("[WARN] DS18B20 disconnected or bad reading");
    return -999.0f;  // sentinel
  }
  return t;
}

float readEC_dSm() {
  // Average 10 samples
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(EC_PIN);
    delay(5);
  }
  float raw = sum / 10.0f;
  float voltage = (raw / 4095.0f) * EC_VOLTAGE_REF;

  // Convert voltage to EC (dS/m) using simplified formula.
  // This is a placeholder — calibrate against a known EC solution.
  // Typical formula: EC = (voltage * conductivity_factor) / cell_constant
  float ec = (voltage * 1.8f) * EC_CELL_CONSTANT;
  return constrain(ec, 0.0f, 20.0f);
}

// ── WiFi ──────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
    blinkLED(3, 100);
  } else {
    Serial.println("\n[WiFi] FAILED – retrying in 10s");
    blinkLED(10, 80);
    delay(10000);
    ESP.restart();
  }
}

// ── MQTT ──────────────────────────────────────────────────────────────────
void connectMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setKeepAlive(60);

  String clientId = String("esp32-") + String((uint32_t)ESP.getEfuseMac(), HEX);

  int backoffMs = 2000;
  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Connecting as ");
    Serial.println(clientId);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("[MQTT] Connected to " + String(MQTT_BROKER));
      reconnectAttempts = 0;
      blinkLED(2, 200);
    } else {
      reconnectAttempts++;
      Serial.print("[MQTT] Failed rc=");
      Serial.print(mqttClient.state());
      Serial.print(" – retry in ");
      Serial.print(backoffMs / 1000);
      Serial.println("s");
      delay(backoffMs);
      backoffMs = min(backoffMs * 2, 60000);  // exponential backoff, cap 60s
    }
  }
}

// ── Publish ───────────────────────────────────────────────────────────────
void publishReading(float moisture, float temperature, float ec) {
  StaticJsonDocument<256> doc;
  doc["device_id"]   = DEVICE_ID;
  doc["timestamp"]   = (long)(millis() / 1000);
  doc["moisture"]    = serialized(String(moisture, 2));
  doc["temperature"] = serialized(String(temperature, 2));
  doc["ec"]          = serialized(String(ec, 3));

  char payload[256];
  serializeJson(doc, payload);

  // LED blink while publishing
  digitalWrite(LED_PIN, HIGH);
  bool ok = mqttClient.publish(MQTT_TOPIC, payload, true);
  digitalWrite(LED_PIN, LOW);

  if (ok) {
    Serial.println("[MQTT] Published: " + String(payload));
  } else {
    Serial.println("[MQTT] Publish FAILED – will retry next cycle");
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\n==============================");
  Serial.println("  TerraSense ESP32 Firmware  ");
  Serial.println("==============================");

  tempSensor.begin();

  connectWiFi();
  connectMQTT();

  Serial.println("[Ready] Publishing every 30 seconds");
}

// ── Loop ──────────────────────────────────────────────────────────────────
void loop() {
  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] Disconnected – reconnecting...");
    connectMQTT();
  }
  mqttClient.loop();

  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Lost connection – reconnecting...");
    connectWiFi();
  }

  unsigned long now = millis();
  if (now - lastReadTime >= READ_INTERVAL_MS) {
    lastReadTime = now;

    float moisture    = readMoisturePct();
    float temperature = readTemperatureC();
    float ec          = readEC_dSm();

    // Skip publish if sensors return bad values
    if (temperature == -999.0f) {
      Serial.println("[Skip] Bad temperature reading – skipping cycle");
      blinkLED(5, 100);
      return;
    }

    Serial.printf("[Sensors] M:%.1f%% T:%.1f°C EC:%.3fdS/m\n",
                  moisture, temperature, ec);

    publishReading(moisture, temperature, ec);
  }
}
