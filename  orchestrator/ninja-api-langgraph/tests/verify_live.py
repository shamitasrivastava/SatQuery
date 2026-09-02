import requests

base_url = 'http://127.0.0.1:8000'

# 1. Health check
h = requests.get(f'{base_url}/api/health').json()
print('Health Response:', h)

# 2. OpenAPI docs check
docs = requests.get(f'{base_url}/api/docs')
print('OpenAPI Docs HTTP Status:', docs.status_code)

# 3. Classify dry-run
cls_resp = requests.post(
    f'{base_url}/api/classify',
    json={'query': 'Where are the airplanes located and what is their type?', 'image_count': 1}
).json()
print('\nClassification Decision:')
print(cls_resp)

# 4. End-to-end query execution
q_resp = requests.post(
    f'{base_url}/api/query',
    json={'query': 'How many airplanes are visible in the image?'}
).json()
print('\nQuery Response:')
print('Task:', q_resp.get('task'))
print('Model:', q_resp.get('model'))
print('Confidence:', q_resp.get('task_confidence'))
print('Result:', q_resp.get('result'))
print('Trace Summary:', q_resp.get('execution_trace', {}).get('summary'))
print('Trace Events Count:', len(q_resp.get('execution_trace', {}).get('events', [])))
for ev in q_resp.get('execution_trace', {}).get('events', []):
    print(f"  Step {ev['step']}: {ev['event']} -> {ev['status']} ({ev['details']})")
