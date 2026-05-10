import requests
import json

url = "http://localhost:8000/predict/fertilizer"
data = {
    "temperature": 32.0,
    "moisture": 40.0,
    "ec": 2.8,
    "soil_type": "Sandy"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
