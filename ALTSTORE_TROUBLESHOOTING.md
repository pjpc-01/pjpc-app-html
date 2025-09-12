# AltStore安装故障排除指南

## 步骤3：安装AltStore到iPhone - 问题排查

### 检查清单：
- [ ] iPhone已用USB连接到电脑
- [ ] iPhone显示"信任此电脑"并已点击信任
- [ ] iPhone和电脑在同一WiFi网络
- [ ] AltStore已成功启动
- [ ] iPhone出现在AltStore设备列表中

### 常见问题解决：

#### 问题1：设备未显示
**症状**：AltStore中看不到iPhone设备
**解决**：
1. 重新插拔USB线
2. 在iPhone上重新点击"信任此电脑"
3. 重启AltStore
4. 确保iTunes已安装

#### 问题2：Apple ID登录失败
**症状**：输入Apple ID后无法登录
**解决**：
1. 检查Apple ID和密码
2. 如果启用了两步验证，输入验证码
3. 使用App专用密码（推荐）
4. 确保Apple ID没有被锁定

#### 问题3：安装失败
**症状**：安装过程中出现错误
**解决**：
1. 检查网络连接
2. 重启AltStore
3. 重新连接iPhone
4. 以管理员身份运行AltStore

#### 问题4：权限错误
**症状**：提示权限不足
**解决**：
1. 右键AltStore，选择"以管理员身份运行"
2. 检查Windows防火墙设置
3. 确保杀毒软件没有阻止AltStore

### 生成App专用密码：
1. 访问：https://appleid.apple.com/
2. 登录Apple ID
3. 在"安全"部分找到"App专用密码"
4. 点击"生成密码"
5. 在AltStore中使用这个密码而不是Apple ID密码

### 如果仍然无法解决：
1. 重启电脑和iPhone
2. 使用不同的USB线
3. 尝试不同的USB端口
4. 检查iPhone是否已越狱（AltStore不支持越狱设备）
