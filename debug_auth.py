import requests
PB_URL = 'http://127.0.0.1:8090'
res = requests.post(f'{PB_URL}/api/admins/auth-with-password', json={'identity': 'temp@test.com', 'password': 'temp_pass'})
print(f"Status: {res.status_code}\nResponse: {res.text}")
