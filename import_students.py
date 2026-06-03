import csv, requests, time
PB_URL = 'http://127.0.0.1:8090'
ADMIN_EMAIL = 'admin@test.com'
ADMIN_PASSWORD='***'
def run():
    time.sleep(2)
    auth = requests.post(f'{PB_URL}/api/admins/auth-with-password', json={'identity': ADMIN_EMAIL, 'password': ADMIN_PASSWORD}).json()
    token = auth.get('token')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    requests.delete(f'{PB_URL}/api/collections/students', headers=headers)
    # FIX: status is now "text" instead of "select" to avoid validation_too_many_values
    requests.post(f'{PB_URL}/api/collections', json={"name": "students", "type": "base", "schema": [{"name": "student_id", "type": "text"}, {"name": "student_name", "type": "text"}, {"name": "dob", "type": "text"}, {"name": "father_phone", "type": "text"}, {"name": "mother_phone", "type": "text"}, {"name": "home_address", "type": "text"}, {"name": "gender", "type": "text"}, {"name": "standard", "type": "text"}, {"name": "register_form_url", "type": "text"}, {"name": "status", "type": "text"}, {"name": "parentName", "type": "text"}]}, headers=headers)
    with open('/home/pjpc/.hermes/document_cache/doc_8b2e3290f7a8_Students Information - Primary.csv', mode='r', encoding='utf-8') as f:
        lines = f.readlines()
        clean_lines = [line.split('|', 1)[1] if '|' in line else line for line in lines]
        reader = csv.DictReader(clean_lines)
        count = 0
        for row in reader:
            name = row.get('Student Name')
            if not name or name == '#N/A': continue
            res = requests.post(f'{PB_URL}/api/collections/students/records', json={"student_id": row.get('ID'), "student_name": name, "dob": row.get('D.O.B'), "father_phone": row.get('Parents Phone Number (Father)'), "mother_phone": row.get('Parents Phone Number (Mother)'), "home_address": row.get('Home Address'), "gender": row.get('Gender'), "standard": row.get('Standard'), "register_form_url": row.get('Register Form URL'), "status": "active", "parentName": row.get('Parents Phone Number (Father)')}, headers=headers)
            if res.status_code == 200: count += 1
    print(f"Imported {count} students.")
run()
