# 🚀 AI-Powered Code Review System

A real-time automated code review platform that integrates with GitHub Pull Requests to analyze code changes, detect issues, and provide inline feedback — all powered by an event-driven architecture.

---

## ✨ Features

* 🔗 **GitHub Webhook Integration**
  Automatically listens to Pull Request events and triggers analysis.

* ⚡ **Real-Time Code Review**
  Parses PR diffs and posts inline review comments directly on GitHub.

* 🧠 **Static Analysis Engine**
  Detects multiple issue categories such as:

  * Debug logs (`console.log`)
  * TODO/FIXME comments
  * Hardcoded secrets
  * Code smells

* 🔄 **Event-Driven Architecture**
  Uses Redis-backed queues and workers to process PRs asynchronously with ultra-fast webhook response times (<10ms).

* 📡 **Live Dashboard (Socket.io)**
  Streams real-time updates:

  ```
  queued → analysing → completed / failed
  ```

* 📊 **Analytics Dashboard**

  * Code quality trends
  * Severity breakdown
  * File heatmaps
  * Developer leaderboard

* 👍 **Feedback Loop**
  Users can provide feedback (thumbs up/down) on each review comment.
  Feedback is stored in MongoDB to improve future analysis.

---

## 🏗️ Architecture Overview

```
GitHub PR Event
      ↓
Webhook (Express)
      ↓
Queue (Redis + Bull)
      ↓
Worker (Analysis Engine)
      ↓
GitHub API (Inline Comments)
      ↓
MongoDB (Storage)
      ↓
React Dashboard (Socket.io)
```

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Recharts, Socket.io-client
* **Backend:** Node.js, Express
* **Database:** MongoDB
* **Queue & Caching:** Redis + Bull
* **GitHub Integration:** Octokit, Webhooks
* **Real-time:** Socket.io

---

## ⚡ Performance Highlights

* ⚡ Sub-10ms webhook response time
* 🔄 Asynchronous PR processing using workers
* 📈 Scalable event-driven design

---

## 🔮 Future Work

* Integrate **CodeBERT** for ML-based code analysis(is in progress)
* Fine-tune models using collected user feedback
* Improve classification of issues (bug, smell, optimization)

---

## 📌 Note

> CodeBERT integration is currently in progress, with plans to leverage user feedback data for fine-tuning and improving code review accuracy.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone <repo-url>

# Backend setup
cd server
npm install
npm run dev

# Frontend setup
cd client
npm install
npm run dev
```

---


## 🤝 Contribution

Contributions are welcome! Feel free to open issues or submit pull requests.

---


