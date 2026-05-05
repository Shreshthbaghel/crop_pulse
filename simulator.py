"""
TerraSense MQTT Simulator
=========================
Publishes realistic ESP32-style sensor payloads to HiveMQ Cloud.
Simulates diurnal patterns, random stress events, and smooth transitions.

Usage:
    pip install paho-mqtt
    python simulator.py
"""

import json
import math
import random
import time
from datetime import datetime

try:
    import paho.mqtt.client as mqtt
except ImportError:
    print("ERROR: paho-mqtt not installed. Run: pip install paho-mqtt")
    exit(1)

# ── Configuration ──────────────────────────────────────────────────────────
BROKER   = "broker.hivemq.com"
PORT     = 1883
TOPIC    = "soil/farm1/zone1"
DEVICE_ID = "esp32_farm1_zone1"
INTERVAL = 30  # seconds between readings

# Stress event probabilities (per reading)
P_DROUGHT   = 0.06
P_SALINITY  = 0.05
P_HEAT      = 0.04
P_NORMAL    = 1 - P_DROUGHT - P_SALINITY - P_HEAT

# ANSI colours
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

# ── State ──────────────────────────────────────────────────────────────────
moisture    = 48.0
temperature = 24.0
ec          = 1.4
stress_mode = None
stress_countdown = 0


def diurnal_temp_offset(hour: int) -> float:
    """Temperature peaks ~14:00, troughs ~05:00."""
    return 5 * math.sin(math.pi * (hour - 5) / 12)


def diurnal_moisture_offset(hour: int) -> float:
    """Moisture is slightly lower midday due to evaporation."""
    return -4 * math.sin(math.pi * (hour - 5) / 12)


def next_reading(hour: int) -> dict:
    global moisture, temperature, ec, stress_mode, stress_countdown

    # Decide stress mode
    if stress_countdown <= 0:
        roll = random.random()
        if roll < P_DROUGHT:
            stress_mode = "drought"
            stress_countdown = random.randint(3, 8)
        elif roll < P_DROUGHT + P_SALINITY:
            stress_mode = "salinity"
            stress_countdown = random.randint(3, 6)
        elif roll < P_DROUGHT + P_SALINITY + P_HEAT:
            stress_mode = "heat"
            stress_countdown = random.randint(2, 5)
        else:
            stress_mode = "normal"
            stress_countdown = random.randint(5, 12)
    else:
        stress_countdown -= 1

    # Target values per mode
    if stress_mode == "drought":
        m_target = random.uniform(8, 18)
        t_target = random.uniform(30, 38) + diurnal_temp_offset(hour)
        e_target = random.uniform(0.6, 1.8)
    elif stress_mode == "salinity":
        m_target = random.uniform(25, 55)
        t_target = random.uniform(22, 30) + diurnal_temp_offset(hour)
        e_target = random.uniform(4.2, 7.5)
    elif stress_mode == "heat":
        m_target = random.uniform(18, 45)
        t_target = random.uniform(39, 52) + diurnal_temp_offset(hour)
        e_target = random.uniform(0.8, 2.5)
    else:  # normal
        m_target = random.uniform(38, 62) + diurnal_moisture_offset(hour)
        t_target = random.uniform(20, 28) + diurnal_temp_offset(hour)
        e_target = random.uniform(0.9, 1.9)

    # Smooth transition (lerp toward target)
    alpha = 0.35
    moisture    = moisture    + alpha * (m_target - moisture)    + random.uniform(-0.8, 0.8)
    temperature = temperature + alpha * (t_target - temperature) + random.uniform(-0.4, 0.4)
    ec          = ec          + alpha * (e_target - ec)          + random.uniform(-0.05, 0.05)

    # Clamp
    moisture    = round(max(0, min(100, moisture)), 2)
    temperature = round(max(-10, min(60, temperature)), 2)
    ec          = round(max(0, min(15, ec)), 3)

    return {
        "device_id":   DEVICE_ID,
        "timestamp":   int(time.time()),
        "moisture":    moisture,
        "temperature": temperature,
        "ec":          ec,
    }


def classify_color(data: dict) -> str:
    m, t, e = data["moisture"], data["temperature"], data["ec"]
    if e > 4.0:             return RED    + "Salinity Stress"  + RESET
    if m < 20:              return YELLOW + "Water Deficiency" + RESET
    if t > 38:              return RED    + "Heat Stress"      + RESET
    if e > 2.5 and m > 40:  return YELLOW + "Over-Fertilization" + RESET
    if e < 0.5:             return CYAN   + "Nutrient Imbalance" + RESET
    return GREEN + "Normal" + RESET


# ── MQTT callbacks ──────────────────────────────────────────────────────────
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"\n{GREEN}{BOLD}[MQTT] Connected to {BROKER}{RESET}\n")
    else:
        print(f"{RED}[MQTT] Connection failed (rc={rc}){RESET}")


def on_publish(client, userdata, mid, rc=None, properties=None):
    pass  # ack


# ── Main ────────────────────────────────────────────────────────────────────
def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"terrasense-sim-{int(time.time())}")
    client.on_connect = on_connect
    client.on_publish = on_publish

    print(f"{BOLD}TerraSense MQTT Simulator{RESET}")
    print(f"Broker : {BROKER}:{PORT}")
    print(f"Topic  : {TOPIC}")
    print(f"Interval: {INTERVAL}s\n")
    print("Connecting...")

    try:
        client.connect(BROKER, PORT, keepalive=60)
    except Exception as e:
        print(f"{RED}Connection error: {e}{RESET}")
        return

    client.loop_start()
    time.sleep(1)

    reading_count = 0
    try:
        while True:
            now = datetime.now()
            payload = next_reading(now.hour)
            json_payload = json.dumps(payload)

            result = client.publish(TOPIC, json_payload, qos=1)
            reading_count += 1

            status = classify_color(payload)
            print(
                f"[{now.strftime('%H:%M:%S')}] #{reading_count:04d} "
                f"M:{payload['moisture']:5.1f}% "
                f"T:{payload['temperature']:5.1f}°C "
                f"EC:{payload['ec']:5.3f}dS/m  "
                f"→ {status}"
            )

            time.sleep(INTERVAL)

    except KeyboardInterrupt:
        print(f"\n{YELLOW}[Simulator] Stopped by user.{RESET}")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
