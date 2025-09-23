#!/bin/bash

# 排班系统一键设置脚本
# 用于自动导入集合、测试API和初始化数据

echo "🚀 开始设置排班系统..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查PocketBase是否安装
if ! command -v pb &> /dev/null; then
    echo -e "${YELLOW}⚠️ PocketBase CLI 未安装，将跳过命令行导入${NC}"
    echo "请手动通过管理界面导入集合文件"
else
    echo -e "${BLUE}1️⃣ 导入集合到PocketBase...${NC}"
    
    # 导入集合
    cd pocketbase_collections
    pb import collections schedules.json
    pb import collections schedule_templates.json
    pb import collections schedule_logs.json
    pb import collections classes.json
    cd ..
    
    echo -e "${GREEN}✅ 集合导入完成${NC}"
fi

# 安装依赖
echo -e "${BLUE}2️⃣ 安装依赖...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
fi

# 运行兼容性检查
echo -e "${BLUE}3️⃣ 检查API兼容性...${NC}"
node scripts/check-api-compatibility.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API兼容性检查通过${NC}"
else
    echo -e "${RED}❌ API兼容性检查失败${NC}"
    exit 1
fi

# 运行API测试
echo -e "${BLUE}4️⃣ 测试API功能...${NC}"
node scripts/test-schedule-api.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API功能测试通过${NC}"
else
    echo -e "${RED}❌ API功能测试失败${NC}"
    exit 1
fi

# 初始化默认数据
echo -e "${BLUE}5️⃣ 初始化默认数据...${NC}"
node scripts/init-schedule-data.js

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 默认数据初始化完成${NC}"
else
    echo -e "${RED}❌ 默认数据初始化失败${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 排班系统设置完成！${NC}"
echo ""
echo -e "${BLUE}📋 下一步：${NC}"
echo "1. 访问排班管理界面: http://localhost:3000/attendance-management"
echo "2. 开始创建排班记录"
echo "3. 配置排班模板"
echo "4. 管理课程信息"
echo ""
echo -e "${YELLOW}💡 提示：如果遇到问题，请查看 docs/setup-guide.md${NC}"
