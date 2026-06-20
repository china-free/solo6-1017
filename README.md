# 机场空管辅助分析平台

## 功能概述

基于 ICAO RECAT-EU 尾流间隔标准的机场空管辅助分析平台，提供：

1. **跑道与航线编辑器** - 在三维地图上交互式定义跑道布局和进离场航线
2. **航班计划管理** - 上传 CSV 格式航班计划表（机型、预计到达时间等）
3. **智能调度算法** - 根据 RECAT-EU 标准计算安全间隔，生成无冲突进近序列
4. **尾流耗散模型** - 基于风速风向动态调整间隔，提升跑道容量
5. **三维可视化** - Deck.gl 实现航班轨迹回放和尾流影响区域展示
6. **跑道占用甘特图** - 实时展示跑道使用状态

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Deck.gl + Ant Design
- **后端**: Node.js + Express + TypeScript
- **数据处理**: 自定义 RECAT-EU 算法 + 尾流耗散模型

## 快速开始

```bash
# 安装所有依赖
npm run install:all

# 启动开发服务器（前后端同时启动）
npm run dev
```

## 航班计划 CSV 格式

```csv
flightId,aircraftType,destination,eta,origin
CA1234,B738,ZBAA,08:30:00,ZSPD
MU5678,A320,ZBAA,08:32:00,ZSSS
...
```

## 项目结构

```
├── client/          # 前端应用
└── server/          # 后端服务
```
