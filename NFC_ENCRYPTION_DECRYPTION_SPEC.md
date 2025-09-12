## NFC encryption/decryption spec (current app)

### Data format on card
- NDEF Text (TNF Well-known, type "T" → hex `54`)
- Payload = status byte + language code `en` + TEXT
- TEXT = `encrypted:salt`

### Plaintext to encrypt
- Compose: `studentId + '_' + randomString`
  - `studentId`: your `students.student_id`
  - `randomString`: 8 chars `[A-Za-z0-9]`

### Key source (server)
- Collection: `encryption_keys`
  - `version` (number), `master_key` (text), `status` (active|legacy|deprecated), `algorithm` (e.g. AES-256)
- App loads keys at startup via `EncryptionService.ensureKeysLoaded()`
- If empty, app seeds one record with current version and built‑in fallback master key

### Key derivation
- Input: `master_key`, `salt`
- `derived_key = SHA256(master_key + salt)` (hex string → bytes when used)

### Cipher (current lightweight implementation)
- XOR stream using `derived_key` bytes (repeat key to length of plaintext)
- Output: Base64 of the XOR result
  - When reading, normalize url‑safe form: replace `-`→`+`, `_`→`/`

### Write flow (student/teacher)
1) Build combined data: `id + '_' + random8`
2) Generate `salt` (8 chars)
3) `encrypted = encryptNFCData(combined, salt)`
4) Compose card TEXT: `encrypted + ':' + salt`
5) Write as NDEF Text (`type=54`, payload bytes per NDEF Text spec)

Relevant code
- `lib/services/encryption_service.dart`
  - `ensureKeysLoaded()` → load PB keys
  - `_generateEncryptionKey(salt, version)` → SHA256(master+salt)
  - `encryptNFCData(nfcData, salt)` → XOR + Base64
  - `decryptNFCData(encrypted, salt)` → try all versions; accepts only plaintext matching `^[A-Za-z0-9]{1,32}_[A-Za-z0-9]{4,64}$`
- `lib/screens/nfc/nfc_read_write_screen.dart`
  - Write: `_writeStudentNfcCard/_writeTeacherNfcCard` → build TEXT and write NDEF Text (type `54`)
  - Read: `_readFromNfcCard` → parse NDEF Text, then `_readStudentNfcCard/_readTeacherNfcCard` → normalize + decrypt → extract id (split `_`)
- `lib/widgets/attendance/nfc_scanner_widget.dart` (attendance scan)
  - Read + decrypt, lookup student, create attendance record

### Read/parse details
- NDEF Text payload bytes: `[status, ...lang('en'), ...textBytes]`
- Status low 5 bits = language length (2 for `en`)
- Extract TEXT string, then split by `:` → `encrypted`, `salt`
- Normalize Base64 and decrypt
- Validate plaintext with regex above, then take substring before first `_` as `studentId`

### Students collection optional fields (for long‑term key mgmt)
- `encryption_key_version` (number): version used for the record
- `encryption_salt` (text): per‑student salt
- `encrypted_uid` (text): encrypted UID for auditing
- `key_rotation_date` (date), `verification_level`, `risk_score`, etc.

### Operational notes
- Active key can be rotated by switching `encryption_keys.status=active` to a newer `version`
- Cards already written continue to decrypt because the app tries all loaded versions
- To force a specific version on card, extend TEXT as `v<version>|encrypted:salt` (optional enhancement)


