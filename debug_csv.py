import csv
with open('/home/pjpc/.hermes/document_cache/doc_8b2e3290f7a8_Students Information - Primary.csv', mode='r', encoding='utf-8') as f:
    lines = f.readlines()
    clean_lines = [line.split('|', 1)[1] if '|' in line else line for line in lines]
    reader = csv.DictReader(clean_lines)
    for i, row in enumerate(reader):
        print(f"Row {i}: {row}")
        if i >= 4: break
