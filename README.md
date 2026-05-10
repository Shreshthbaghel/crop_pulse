# CropPulse Enterprise: Production Architecture

This repository follows a professional service-oriented architecture, separating the concerns of the frontend, backend, ML engine, and IoT firmware.

## 🏗️ System Architecture

### 1. [🌐 frontend](./frontend)
**Role:** Client-side interface for farmers and administrators.
*   **Tech Stack:** React 19, Vite, Tailwind CSS 4.
*   **Features:** Real-time dashboards, analytical charts, and device control.
*   **Setup:** `cd frontend && npm install && npm run dev`

### 2. [⚙️ backend](./backend)
**Role:** Central API Gateway and coordination layer.
*   **Tech Stack:** Node.js, Express, Firebase Admin, MQTT.
*   **Features:** Authentication, database persistence, and IoT communication.
*   **Setup:** `cd backend && npm install && npm run dev`

### 3. [🧠 intelligence-service](./intelligence-service)
**Role:** AI/ML inference and data processing.
*   **Tech Stack:** Python 3.10, FastAPI, Scikit-Learn.
*   **Features:** Soil stress classification, anomaly detection, and crop recommendation.
*   **Setup:** `cd intelligence-service && pip install -r requirements.txt`

### 4. [📟 iot-firmware](./iot-firmware)
**Role:** Edge computing and sensor data acquisition.
*   **Tech Stack:** C++, ESP-IDF / Arduino.
*   **Features:** Deep sleep management, MQTT publishing, and sensor calibration.

---

## 🚀 Rapid Deployment

### Development Mode
1.  **Start Intelligence Service:**
    ```bash
    cd intelligence-service/api
    python main.py
    ```
2.  **Start Backend:**
    ```bash
    cd backend
    npm run dev
    ```
3.  **Start Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

---

## 🛠️ Environment Configuration
Copy the `.env` file into both `frontend/` and `backend/` as needed. Ensure `GEMINI_API_KEY` is set for AI features.

---
© 2024 JSSSTU Hackathon - CropPulse Engineering Team

