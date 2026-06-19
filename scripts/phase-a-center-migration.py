#!/usr/bin/env python3
"""Phase A: PB schema changes + data migration
1. Add centerId relation to teachers
2. Add centerId relation to courses  
3. Migrate students.text.center → students.relation.centerId
"""

import json, os, sys, time

PB_URL = "http://127.0.0.1:8090"
CENTERS_COLLECTION_ID = "kc397vhuo8w0hoi"  # centers collection in PB

def get_token():
    r = os.popen(
        f'curl -s --connect-timeout 5 -X POST "{PB_URL}/api/admins/auth-with-password" '
        f'-H "Content-Type: application/json" '
        f'-d \'{{"identity":"final_admin@test.com","password":"final_pass"}}\''
    ).read()
    return json.loads(r).get("token", "")

def api_get(path, token):
    r = os.popen(f'curl -s --connect-timeout 5 "{PB_URL}{path}" -H "Authorization: {token}"').read()
    return json.loads(r) if r else {}

def api_patch(path, data, token):
    r = os.popen(
        f'curl -s --connect-timeout 10 -X PATCH "{PB_URL}{path}" '
        f'-H "Authorization: {token}" '
        f'-H "Content-Type: application/json" '
        f'-d \'{json.dumps(data)}\''
    ).read()
    return json.loads(r) if r else {}

def api_get_all(path, token):
    """Get all records with pagination"""
    all_items = []
    page = 1
    while True:
        r = api_get(f"{path}?page={page}&perPage=100", token)
        items = r.get("items", [])
        if not items:
            break
        all_items.extend(items)
        if len(items) < 100:
            break
        page += 1
    return all_items

def api_update_record(collection, record_id, data, token):
    r = os.popen(
        f'curl -s --connect-timeout 10 -X PATCH "{PB_URL}/api/collections/{collection}/records/{record_id}" '
        f'-H "Authorization: {token}" '
        f'-H "Content-Type: application/json" '
        f'-d \'{json.dumps(data)}\''
    ).read()
    return json.loads(r) if r else {}

def add_relation_field(collection_name, token):
    """Add a centerId relation field to a collection"""
    print(f"\n=== Adding centerId to {collection_name} ===")
    
    # Get current collection
    coll = api_get(f"/api/collections/{collection_name}", token)
    if "code" in coll:
        print(f"  ERROR: {coll.get('message', 'unknown')}")
        return False
    
    # Check if field already exists
    existing = [f for f in coll.get("schema", []) if f["name"] == "centerId"]
    if existing:
        print(f"  centerId already exists (id={existing[0]['id']})")
        return True
    
    schema = coll.get("schema", [])
    
    # Add centerId relation field
    new_field = {
        "system": False,
        "name": "centerId",
        "type": "relation",
        "required": False,
        "presentable": False,
        "unique": False,
        "options": {
            "collectionId": CENTERS_COLLECTION_ID,
            "cascadeDelete": False,
            "minSelect": None,
            "maxSelect": 1,
            "displayFields": ["name", "code"]
        }
    }
    
    schema.append(new_field)
    
    result = api_patch(f"/api/collections/{collection_name}", {"schema": schema}, token)
    if "code" in result:
        print(f"  FAILED: {result.get('message', '')}")
        return False
    
    print(f"  ✅ centerId added to {collection_name}")
    return True

def migrate_students(token):
    """Migrate students: map text 'center' to 'centerId' relation"""
    print("\n=== Migrating students center text → centerId relation ===")
    
    # Get all students
    students = api_get_all("/api/collections/students/records", token)
    print(f"  Total students: {len(students)}")
    
    # Get center map: code → id
    centers = api_get_all("/api/collections/centers/records", token)
    center_map = {}
    for c in centers:
        code = c.get("code", "").upper()
        center_map[code] = c["id"]
        center_map[c.get("name", "")] = c["id"]
    print(f"  Center mapping: {json.dumps({k: v for k, v in center_map.items() if len(k) < 10})} ")
    
    updated = 0
    skipped = 0
    errors = []
    
    for s in students:
        center_text = (s.get("center") or "").strip()
        existing_id = s.get("centerId") or ""
        
        if not center_text:
            # No center text to migrate from
            skipped += 1
            continue
        
        if existing_id and existing_id != "null":
            # Already has centerId set
            skipped += 1
            continue
        
        # Map text to center ID
        center_code = center_text.upper()
        if "WX" in center_code or "PU" in center_code or center_code == "PU1":
            center_id = center_map.get("PU1")
        elif "BATU" in center_code or center_code == "BATU14":
            center_id = center_map.get("BATU14")
        else:
            # Try to match by name
            center_id = center_map.get(center_text) or center_map.get(center_code)
        
        if not center_id:
            # Fallback: use grade-based logic
            grade = (s.get("grade") or s.get("standard") or "").lower()
            if any(kw in grade for kw in ["standard", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
                                           "1", "2", "3", "4", "5", "6"]):
                center_id = center_map.get("BATU14")
                if not center_id:
                    # Find BATU14 by code
                    for c in centers:
                        if c.get("code") == "BATU14":
                            center_id = c["id"]
                            break
            else:
                center_id = center_map.get("PU1")
                if not center_id:
                    for c in centers:
                        if c.get("code") == "PU1":
                            center_id = c["id"]
                            break
        
        if not center_id:
            errors.append(f"Cannot map {s.get('name','?')}: center='{center_text}'")
            continue
        
        # Update the record
        result = api_update_record("students", s["id"], {"centerId": center_id}, token)
        if "code" in result:
            errors.append(f"Update failed for {s.get('name','?')}: {result.get('message','')}")
        else:
            updated += 1
            if updated % 20 == 0:
                print(f"  Progress: {updated} updated...")
    
    print(f"\n  ✅ Updated: {updated}")
    print(f"  ⏭  Skipped: {skipped} (no center text or already has centerId)")
    if errors:
        print(f"  ❌ Errors ({len(errors)}):")
        for e in errors[:5]:
            print(f"     {e}")
    return updated

def migrate_with_grade_rule(token):
    """For remaining students without center text, use grade-based rule"""
    print("\n=== Grade-based center assignment for unassigned students ===")
    
    # Get center IDs
    centers = api_get_all("/api/collections/centers/records", token)
    pu1_id = next(c["id"] for c in centers if c.get("code") == "PU1")
    batu14_id = next(c["id"] for c in centers if c.get("code") == "BATU14")
    
    # Get students with no centerId
    students = api_get_all("/api/collections/students/records?filter=(centerId=null||centerId='')", token)
    if not students:
        # Try without filter - get all and filter locally
        students = api_get_all("/api/collections/students/records", token)
        students = [s for s in students if not s.get("centerId") or s.get("centerId") == "null"]
    
    print(f"  Unassigned students: {len(students)}")
    
    for s in students:
        grade = (s.get("grade") or s.get("standard") or "").strip()
        
        if not grade:
            continue  # Skip unknown grades
        
        grade_lower = grade.lower()
        
        # Primary school → BATU14
        if any(kw in grade_lower for kw in ["standard", "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
                                              "1", "2", "3", "4", "5", "6", "tahun"]):
            if any(grade.strip() in ["1", "2", "3", "4", "5", "6"] for kw_filter in []):
                pass
            center_id = batu14_id
        elif any(kw in grade_lower for kw in ["form", "预备班", "中一", "中二", "中三", "中四", "中五",
                                               "7", "8", "9", "10", "11", "12", "tingkatan"]):
            center_id = pu1_id
        else:
            continue  # Can't determine
        
        api_update_record("students", s["id"], {"centerId": center_id}, token)
        print(f"  → {s.get('name','?')} ({grade}) → {center_id[:8]}...")

if __name__ == "__main__":
    token = get_token()
    if not token:
        print("Failed to get admin token!")
        sys.exit(1)
    
    print(f"Token: {token[:20]}...")
    
    # Step 1: Add centerId to teachers
    add_relation_field("teachers", token)
    
    # Step 2: Add centerId to courses
    add_relation_field("courses", token)
    
    # Step 3: Migrate students center text → centerId
    migrate_students(token)
    
    # Step 4: Grade-based rule for remaining
    migrate_with_grade_rule(token)
    
    # Verify
    print("\n=== Verification ===")
    centers = api_get_all("/api/collections/centers/records", token)
    for c in centers:
        # Count students per center
        students_in_center = api_get(f"/api/collections/students/records?filter=(centerId='{c['id']}')&perPage=1", token)
        total = students_in_center.get("totalItems", "?")
        print(f"  {c['code']}: {total} students")
    
    print("\n✅ Phase A complete!")
