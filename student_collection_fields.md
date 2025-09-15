# 📊 学生集合 (students) 数据结构详情

此文档描述了名为 "students" 的数据集合的字段结构，该集合类型为 "Base"。

## 🏷️ 集合基本信息
- **名称 (Name):** `students`
- **类型 (Type):** `Base`

## 📋 字段列表 (Fields)

以下是 "students" 集合中定义的各个字段及其属性：

### 🔐 安全相关字段
1. **`encrypted_uid`**
   - **类型:** Text (T)
   - **描述:** 加密的唯一用户标识符

2. **`key_rotation_date`**
   - **类型:** Date (📅)
   - **描述:** 密钥轮换日期

3. **`suspicious_activities`**
   - **类型:** Number (#)
   - **描述:** 记录可疑活动的数量或分数

4. **`risk_score`**
   - **类型:** Number (#)
   - **描述:** 用户的风险评分

5. **`verification_level`**
   - **类型:** Select (☰)
   - **可选值:** `normal`, `high`, `emergency`
   - **选择方式:** Single (单选)
   - **描述:** 用户的验证级别

6. **`encryption_algorithm`**
   - **类型:** Select (☰)
   - **可选值:** `AES-128`, `AES-192`, `AES-256`, `CI`
   - **选择方式:** Single (单选)
   - **描述:** 使用的加密算法

### 👤 基本信息字段
7. **`id`**
   - **类型:** Text (T)
   - **描述:** 学生唯一标识符

8. **`student_id`**
   - **类型:** Text (T)
   - **约束:** Nonempty (必填)
   - **描述:** 学号

9. **`student_name`**
   - **类型:** Text (T)
   - **约束:** Nonempty (必填)
   - **描述:** 学生姓名

10. **`standard`**
    - **类型:** Text (T)
    - **约束:** Nonempty (必填)
    - **描述:** 年级/班级

11. **`center`**
    - **类型:** Select (☰)
    - **可选值:** `WX 01`, `WX 02`, `WX 03`, `WX 04`
    - **选择方式:** Single (单选)
    - **描述:** 中心/分校

12. **`parents_name`**
    - **类型:** Text (T)
    - **约束:** Nonempty (必填)
    - **描述:** 家长姓名

13. **`parents_phone`**
    - **类型:** Text (T)
    - **描述:** 家长电话

14. **`dob`**
    - **类型:** Date (📅)
    - **描述:** 出生日期

15. **`gender`**
    - **类型:** Text (T)
    - **描述:** 性别

### 🏠 地址和联系信息
16. **`home_address`**
    - **类型:** Text (T)
    - **描述:** 家庭地址

17. **`school`**
    - **类型:** Text (T)
    - **描述:** 学校名称

18. **`emergencyContactName`**
    - **类型:** Text (T)
    - **描述:** 紧急联系人姓名

19. **`emergencyContactPhone`**
    - **类型:** Text (T)
    - **描述:** 紧急联系人电话

20. **`medicalNotes`**
    - **类型:** Text (T)
    - **描述:** 医疗备注

### 📋 接送和授权信息
21. **`pickupMethod`**
    - **类型:** Text (T)
    - **描述:** 接送方式

22. **`authorizedPickup1Name`**
    - **类型:** Text (T)
    - **描述:** 授权接送人1姓名

23. **`authorizedPickup1Phone`**
    - **类型:** Text (T)
    - **描述:** 授权接送人1电话

24. **`authorizedPickup2Name`**
    - **类型:** Text (T)
    - **描述:** 授权接送人2姓名

25. **`authorizedPickup2Phone`**
    - **类型:** Text (T)
    - **描述:** 授权接送人2电话

26. **`authorizedPickup3Name`**
    - **类型:** Text (T)
    - **描述:** 授权接送人3姓名

27. **`authorizedPickup3Phone`**
    - **类型:** Text (T)
    - **描述:** 授权接送人3电话

### 📄 文件和文档
28. **`photo`**
    - **类型:** File (📁)
    - **配置:** Single (单文件)
    - **描述:** 学生照片

29. **`birthCert`**
    - **类型:** File (📁)
    - **配置:** Single (单文件)
    - **描述:** 出生证明

### 💳 NFC卡相关字段
30. **`nric`**
    - **类型:** Text (T)
    - **描述:** 身份证号码

31. **`cardNumber`**
    - **类型:** Text (T)
    - **描述:** 卡号

32. **`cardType`**
    - **类型:** Select (☰)
    - **可选值:** `NFC`, `RFID`
    - **选择方式:** Single (单选)
    - **描述:** 卡类型

33. **`studentUrl`**
    - **类型:** URL (🔗)
    - **描述:** 学生URL

34. **`balance`**
    - **类型:** Number (#)
    - **描述:** 余额

35. **`cardStatus`**
    - **类型:** Select (☰)
    - **可选值:** `active`, `inactive`, `lost`, `graduate`
    - **选择方式:** Single (单选)
    - **描述:** 卡状态

36. **`issuedDate`**
    - **类型:** Date (📅)
    - **描述:** 发卡日期

37. **`expiryDate`**
    - **类型:** Date (📅)
    - **描述:** 过期日期

### 📚 学籍和状态
38. **`enrollmentDate`**
    - **类型:** Date (📅)
    - **描述:** 入学日期

39. **`status`**
    - **类型:** Select (☰)
    - **可选值:** `active`, `graduated`, `transferred`
    - **选择方式:** Single (单选)
    - **约束:** Nonempty (必填)
    - **描述:** 学生状态

40. **`level`**
    - **类型:** Select (☰)
    - **可选值:** `Primary`, `Secondary`
    - **选择方式:** Single (单选)
    - **描述:** 教育级别

### 🔒 安全和监控字段
41. **`security_status`**
    - **类型:** Select (☰)
    - **可选值:** `normal`, `suspicious`, `locked`
    - **选择方式:** Single (单选)
    - **描述:** 安全状态

42. **`last_swipe_time`**
    - **类型:** DateTime (📅)
    - **描述:** 最后刷卡时间

43. **`swipe_count_today`**
    - **类型:** Number (#)
    - **描述:** 今日刷卡次数

44. **`auto_lock_until`**
    - **类型:** DateTime (📅)
    - **描述:** 自动锁定到期时间

45. **`lock_reason`**
    - **类型:** Text (T)
    - **描述:** 锁定原因

46. **`encryption_key_version`**
    - **类型:** Number (#)
    - **描述:** 加密密钥版本

47. **`encryption_salt`**
    - **类型:** Text (T)
    - **描述:** 加密盐值

### 📝 其他字段
48. **`register_form_url`**
    - **类型:** URL (🔗)
    - **描述:** 注册表单URL

49. **`notes`**
    - **类型:** Text (T)
    - **描述:** 备注

## 🔄 NFC关联建议

基于当前的学生集合结构，建议添加以下字段来支持NFC关联功能：

### 建议新增字段
- **`nfc_tag_id`** (Text): NFC标签ID
- **`nfc_associated_at`** (DateTime): NFC关联时间
- **`nfc_last_used`** (DateTime): NFC最后使用时间
- **`nfc_usage_count`** (Number): NFC使用次数

## ⚠️ 注意事项

1. **安全字段:** 根据之前的对话，您曾要求移除所有加密和安全机制。当前集合中仍包含多个安全相关字段，如需移除请告知。

2. **必填字段:** 以下字段标记为必填 (Nonempty):
   - `student_id`
   - `student_name`
   - `standard`
   - `parents_name`
   - `status`

3. **枚举字段:** 多个字段使用选择类型，确保数据一致性。

4. **文件字段:** `photo` 和 `birthCert` 支持单文件上传。

---

**文档生成时间:** ${DateTime.now().toString().substring(0, 19)}
**版本:** 1.0
