# 📊 Excel Data Analyzer (EDA)

Industrial Data Workspace for Excel Data Analysis. Modern, High-Performance, and AI-Driven data processing for large-scale industrial datasets.

---

## 🚀 Overview

**Excel Data Analyzer (EDA)** is a specialized tool built for industrial data management. It provides a powerful interface for cleaning, analyzing, and visualizing industrial sensor data, inventory logs, and factory output reports.

Leveraging **Next.js 15**, **Express**, and **Gemini AI**, EDA allows teams to:
- **Clean Nulls & Formatting**: Auto-fix data inconsistencies with AI prompts or built-in macros.
- **VPN Tunnel Support**: Securely connect to cloud nodes for data fetching.
- **Large Dataset Support**: Handle thousands of rows with a high-performance grid.
- **AI Command Center**: Interactive chat interface powered by Gemini to run complex data analyses.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS, Lucide-Icons, Framer Motion
- **Backend**: Express.js, Node.js, `xlsx` (Excel processing engine)
- **AI Integration**: Google Generative AI (Gemini)
- **Deployment**: Standalone Node.js or Docker (via standalone output)

---

## ⚙️ Prerequisites

- **Node.js**: v18.x or later
- **NPM**: v9.x or later
- **Gemini API Key**: Obtain one from [AI Studio](https://ai.studio)

---

## 🚀 How to Run

Before starting, ensure you have a `.env.local` file in the root directory with your API key:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:4002"
```

- **To start**: Simply double-click `start_server.bat`. It will automatically handle dependency installation if `node_modules` are missing.
- **To stop**: Double-click `stop_server.bat`.

---

## 📊 Key Features

- **Industrial UI**: Designed for high visibility and productivity.
- **Pipeline Monitoring**: Real-time status indicators for VPN and data fetching.
- **Advanced Grid**: Interactive table with status color-coding and column-based filtering.
- **Log System**: Detailed terminal-style logs for all system executions.

---

## 📝 Configuration

To change the ports, edit the following:
- **Frontend Port**: Modify `start_server.bat` (change the `-p` value).
- **Backend Port**: Update `backend/server.js` or set a `PORT` environment variable in `.env.local`.

---

## 🤝 Contributing

This is a public open-source project. Contributions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">Built with 💙 for Industrial Data Analysis communities.</p>
