import os
import requests
import json

BASE_URL = "http://127.0.0.1:8000"
GEOCHAT_URL = "http://127.0.0.1:8001"

print("=" * 60)
print("SATQUERY AI — END-TO-END LIVE MODEL & BACKEND TEST SUITE")
print("=" * 60)

# 1. Test Microservice Health
print("\n[TEST 1] Checking GeoChat Specialist Service (Port 8001)...")
r_geo = requests.get(f"{GEOCHAT_URL}/health", timeout=5.0).json()
print("GeoChat Service Health:", r_geo)
assert r_geo["ready"] is True, "GeoChat is not ready"

# 2. Test Django Ninja Backend Health
print("\n[TEST 2] Checking Django Ninja Backend API (Port 8000)...")
r_backend = requests.get(f"{BASE_URL}/api/health", timeout=5.0).json()
print("Django Backend Health:", r_backend)
assert r_backend["status"] == "healthy"

# 3. Test Single-Image VQA (Airplanes)
print("\n[TEST 3] Running Single-Image VQA Query via Django Ninja...")
payload_vqa = {
    "query": "How many airplanes are visible in the image?",
    "parameters": {
        "images": [r"C:\geochat\vqa_grounding\GeoChat\demo_images\train_2956_0001.png"]
    }
}
resp_vqa = requests.post(f"{BASE_URL}/api/query", json=payload_vqa, timeout=60.0).json()
print("Task Identified:", resp_vqa["task"])
print("Model Executed:", resp_vqa["model"])
print("Task Confidence:", resp_vqa["task_confidence"])
print("Model Answer:", resp_vqa["result"])
print("Execution Trace Steps:")
for step in resp_vqa["execution_trace"]["events"]:
    print(f"  Step {step['step']}: {step['event']} -> {step['status']} ({step['details']})")
assert "airplane" in resp_vqa["result"].lower() or "2" in resp_vqa["result"]

# 4. Test Flood Query
print("\n[TEST 4] Running Flood Image VQA Query via Django Ninja...")
payload_flood = {
    "query": "How many buildings are flooded?",
    "parameters": {
        "images": [r"C:\geochat\vqa_grounding\GeoChat\demo_images\7292.JPG"]
    }
}
resp_flood = requests.post(f"{BASE_URL}/api/query", json=payload_flood, timeout=60.0).json()
print("Task Identified:", resp_flood["task"])
print("Model Answer:", resp_flood["result"])
assert len(resp_flood["result"]) > 0

# 5. Test Object Grounding with Bounding Box Evidence
print("\n[TEST 5] Running Object Grounding Query via Django Ninja...")
payload_grounding = {
    "query": "Where are the airplanes located and what is their type?",
    "parameters": {
        "images": [r"C:\geochat\vqa_grounding\GeoChat\demo_images\train_2956_0001.png"]
    }
}
resp_grounding = requests.post(f"{BASE_URL}/api/query", json=payload_grounding, timeout=60.0).json()
print("Task Identified:", resp_grounding["task"])
print("Model Answer:", resp_grounding["result"])
print("Visual Evidence Extracted:", resp_grounding["visual_evidence"])
assert resp_grounding["task"] == "object_grounding"

# 6. Test Bi-Temporal Change Detection
print("\n[TEST 6] Running Bi-Temporal Comparison Query via Django Ninja...")
payload_change = {
    "query": "What changed between these two satellite images?",
    "parameters": {
        "images": [
            r"C:\geochat\vqa_grounding\GeoChat\demo_images\train_2956_0001.png",
            r"C:\geochat\vqa_grounding\GeoChat\demo_images\church_183.png"
        ]
    }
}
resp_change = requests.post(f"{BASE_URL}/api/query", json=payload_change, timeout=60.0).json()
print("Task Identified:", resp_change["task"])
print("Model Answer:", resp_change["result"])
print("Evidence:", resp_change["visual_evidence"])
assert resp_change["task"] == "change_detection"

# 7. Test Direct Multipart Image File Upload
print("\n[TEST 7] Running Direct Multipart Image File Upload Query...")
img_file_path = r"C:\geochat\vqa_grounding\GeoChat\demo_images\train_2956_0001.png"
with open(img_file_path, "rb") as f:
    files = [("files", ("satellite_upload.png", f, "image/png"))]
    data = {"query": "What is present in this image?", "temperature": 0.6}
    resp_upload = requests.post(f"{BASE_URL}/api/query/upload", data=data, files=files, timeout=60.0).json()

print("Upload Task Identified:", resp_upload["task"])
print("Upload Model Answer:", resp_upload["result"])
print("Upload Trace Summary:", resp_upload["execution_trace"]["summary"])
assert resp_upload["execution_status"] == "Success"

print("\n" + "=" * 60)
print(">>> ALL 7 END-TO-END SYSTEM INTEGRATION TESTS PASSED 100% <<<")
print("=" * 60)
