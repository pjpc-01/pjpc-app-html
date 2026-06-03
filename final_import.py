import csv, requests
PB_URL = 'http://127.0.0.1:8090'
def run():
    auth = requests.post(f'{PB_URL}/api/admins/auth-with-password', json={'identity': 'final_admin@test.com', 'password': 'final_pass'}).json()
    token = auth.get('token')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    requests.delete(f'{PB_URL}/api/collections/students', headers=headers)
    requests.post(f'{PB_URL}/api/collections', json={"name": "students", "type": "base", "schema": [{"name": "student_id", "type": "text"}, {"name": "student_name", "type": "text"}, {"name": "dob", "type": "text"}, {"name": "father_phone", "type": "text"}, {"name": "mother_phone", "type": "text"}, {"name": "home_address", "type": "text"}, {"name": "gender", "type": "text"}, {"name": "standard", "type": "text"}, {"name": "register_form_url", "type": "text"}, {"name": "status", "type": "text"}, {"name": "parentName", "type": "text"}]}, headers=headers)
    requests.patch(f'{PB_URL}/api/collections/students', json={"listRule": "", "viewRule": "", "createRule": "", "updateRule": "", "deleteRule": ""}, headers=headers)
    with open('/home/pjpc/.hermes/document_cache/doc_8b2e3290f7a8_Students Information - Primary.csv', mode='r', encoding='utf-8') as f:
        lines = f.readlines()
        clean_lines = [line.split('|', 1)[1] if '|' in line else line for line in lines]
        reader = csv.DictReader(clean_lines)
        count = 0
        for row in reader:
            print(f"Trying to import: {row.get('Student Name')}")
            res = requests.post(f'{PB_URL}/api/collections/students/records', json={"student_id": row.get('ID'), "student_name": row.get('Student Name'), "status": "active"}, headers=headers)
            print(f"Response: {res.status_code} {res.text}")
            if res.status_code == 200: count += 1
            if count >= 1: break
    print(f"Imported {count} students.")
run()
