import json, os, urllib.request as req

TOKEN = os.environ["PB_TOKEN"]

cards = json.load(open("/tmp/cards.json"))["items"]
students = json.load(open("/tmp/students.json"))["items"]

name_to_student = {}
for s in students:
    n = (s.get("student_name") or s.get("name") or "").lower().strip()
    cn = (s.get("name") or "").lower().strip()
    name_to_student[n] = s
    if cn != n:
        name_to_student[cn] = s

fixed = deleted = skipped = 0

for card in cards:
    if card.get("type") == "student" and not card.get("studentId"):
        notes = card.get("notes", "")
        name_part = ""
        if " - " in notes:
            name_part = notes.split(" - ", 1)[1].strip().lower()

        match = name_to_student.get(name_part)

        if not match and name_part:
            for sn, st in name_to_student.items():
                if name_part in sn or sn in name_part:
                    match = st
                    break

        if match:
            if match.get("cardNumber") and match["cardNumber"] not in ("", "-") and match["cardNumber"] != card["card_uid"]:
                print(f"跳过: {card['card_uid']} -> {match.get('student_name')} (已有卡 {match['cardNumber']})")
                skipped += 1
                continue

            patch = json.dumps({"studentId": match["id"]}).encode()
            r = req.Request(
                f"http://127.0.0.1:8090/api/collections/nfc_cards/records/{card['id']}",
                data=patch, method="PATCH",
                headers={"Authorization": TOKEN, "Content-Type": "application/json"}
            )
            req.urlopen(r)

            if not match.get("cardNumber") or match["cardNumber"] in ("", "-"):
                patch2 = json.dumps({"cardNumber": card["card_uid"]}).encode()
                r2 = req.Request(
                    f"http://127.0.0.1:8090/api/collections/students/records/{match['id']}",
                    data=patch2, method="PATCH",
                    headers={"Authorization": TOKEN, "Content-Type": "application/json"}
                )
                req.urlopen(r2)

            print(f"修复: {card['card_uid']} -> {match.get('student_name')}")
            fixed += 1

        elif card["card_uid"] in ("", "-"):
            r = req.Request(
                f"http://127.0.0.1:8090/api/collections/nfc_cards/records/{card['id']}",
                method="DELETE",
                headers={"Authorization": TOKEN}
            )
            req.urlopen(r)
            print(f"删除: uid=空 (无效卡)")
            deleted += 1
        else:
            print(f"跳过: {card['card_uid']} ({name_part[:30]}) - 找不到对应学生")
            skipped += 1

print(f"\n完成: 修复{fixed}张, 删除{deleted}张, 跳过{skipped}张")
