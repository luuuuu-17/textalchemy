# TextAlchemy / 文字炼金术

一个有趣的文字动画网站：输入一句话，AI 会生成一句风趣有哲理的回复，并以字符重组动画呈现。

## 在线体验

[点此体验](https://你的项目名.vercel.app)（部署后把链接贴这里）

## 本地运行

### 1) 准备环境变量

复制 `.env.example` 为 `.env`，填入你的 DeepSeek API Key：

```
DEEPSEEK_API_KEY=你的key
```

### 2) 安装依赖

```bash
npm install
```

### 3) 启动后端

```bash
npm run server:dev
```

### 4) 启动前端（新开终端）

```bash
npm run dev
```

访问 `http://localhost:5173`

## 部署到 Vercel

1. 把代码推送到 GitHub
2. 在 Vercel 导入该项目
3. 添加环境变量：`DEEPSEEK_API_KEY`
4. 部署即可

## 技术栈

- 前端：React + TypeScript + Vite + Tailwind CSS
- 动画：GSAP
- 后端：Express + TypeScript
- AI：DeepSeek API
