# PocketBase 集合设置步骤

## 🎯 需要创建的集合

在运行数据库迁移之前，需要先在 PocketBase 管理界面中创建 `point_seasons` 集合。

## 📋 步骤说明

### 1. 访问 PocketBase 管理界面

打开浏览器，访问：`http://pjpc.tplinkdns.com:8090/_/`

使用管理员账号登录：
- 邮箱：`pjpcemerlang@gmail.com`
- 密码：`0122270775Sw!`

### 2. 创建 point_seasons 集合

1. 在左侧菜单中点击 **"Collections"**
2. 点击 **"New Collection"** 按钮
3. 填写集合信息：
   - **Name**: `point_seasons`
   - **Type**: `Base`
   - **System**: 取消勾选

### 3. 添加字段

按照以下顺序添加字段：

#### 字段 1: season_name
- **Name**: `season_name`
- **Type**: `Text`
- **Required**: ✅ 勾选
- **Presentable**: ✅ 勾选
- **Unique**: ✅ 勾选
- **Min length**: `1`
- **Max length**: `100`

#### 字段 2: start_date
- **Name**: `start_date`
- **Type**: `Date`
- **Required**: ✅ 勾选
- **Presentable**: 取消勾选

#### 字段 3: end_date
- **Name**: `end_date`
- **Type**: `Date`
- **Required**: ✅ 勾选
- **Presentable**: 取消勾选

#### 字段 4: is_active
- **Name**: `is_active`
- **Type**: `Bool`
- **Required**: ✅ 勾选
- **Presentable**: 取消勾选

#### 字段 5: clear_date
- **Name**: `clear_date`
- **Type**: `Date`
- **Required**: 取消勾选
- **Presentable**: 取消勾选

### 4. 设置索引

在 **"Indexes"** 标签页中添加以下索引：

```sql
CREATE INDEX idx_point_seasons_active ON point_seasons (is_active)
CREATE INDEX idx_point_seasons_dates ON point_seasons (start_date, end_date)
```

### 5. 设置权限规则

在 **"Rules"** 标签页中设置权限：

- **List rule**: 留空（允许所有用户查看）
- **View rule**: 留空（允许所有用户查看）
- **Create rule**: 留空（允许所有用户创建）
- **Update rule**: 留空（允许所有用户更新）
- **Delete rule**: 留空（允许所有用户删除）

### 6. 保存集合

点击 **"Create"** 按钮保存集合。

## 🔄 更新现有集合

### 更新 student_points 集合

1. 在 Collections 列表中找到 `student_points`
2. 点击编辑
3. 添加新字段：
   - **Name**: `season_id`
   - **Type**: `Relation`
   - **Collection**: `point_seasons`
   - **Required**: ✅ 勾选
   - **Max select**: `1`
   - **Display fields**: `["season_name"]`

4. 删除旧字段：
   - 删除 `season_number` 字段

5. 更新索引：
   ```sql
   CREATE INDEX idx_student_points_season ON student_points (season_id)
   ```

### 更新 point_transactions 集合

1. 在 Collections 列表中找到 `point_transactions`
2. 点击编辑
3. 添加新字段：
   - **Name**: `season_id`
   - **Type**: `Relation`
   - **Collection**: `point_seasons`
   - **Required**: ✅ 勾选
   - **Max select**: `1`
   - **Display fields**: `["season_name"]`

4. 删除旧字段：
   - 删除 `season_number` 字段

5. 更新索引：
   ```sql
   CREATE INDEX idx_point_transactions_season ON point_transactions (season_id)
   ```

## ✅ 验证设置

完成上述步骤后，运行迁移脚本验证：

```bash
node scripts/migrate-points-schema.mjs
```

如果一切正常，您应该看到：
- ✅ 管理员认证成功
- ✅ 默认赛季已存在或创建成功
- ✅ 学生积分记录更新成功
- ✅ 积分交易记录更新成功
- ✅ 教师记录更新成功

## 🚨 注意事项

1. **备份数据**：在进行任何数据库修改之前，建议先备份现有数据
2. **测试环境**：如果可能，先在测试环境中验证这些更改
3. **权限设置**：根据您的安全需求调整权限规则
4. **索引优化**：确保添加了必要的数据库索引以提高查询性能

## 📞 需要帮助？

如果在设置过程中遇到问题，请检查：
1. PocketBase 服务器是否正常运行
2. 管理员账号是否有足够权限
3. 网络连接是否正常
4. 字段类型和约束是否正确设置
