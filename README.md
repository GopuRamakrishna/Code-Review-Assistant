# 🚀 AI-Powered Code Review System

A real-time automated code review platform that integrates with GitHub Pull Requests to analyze code changes, detect issues, and provide inline feedback — all powered by an event-driven architecture.

## ✨ Features

- 🔗 **GitHub Webhook Integration** — Automatically listens to Pull Request events and triggers analysis.
- ⚡ **Real-Time Code Review** — Parses PR diffs and posts inline review comments directly on GitHub.
- 🧠 **Static Analysis Engine** — Detects multiple issue categories such as:
  - Debug logs (`console.log`)
  - TODO/FIXME comments
  - Hardcoded secrets
  - Code smells
- 🔄 **Event-Driven Architecture** — Uses Redis-backed queues and workers to process PRs asynchronously with ultra-fast webhook response times (<10ms).
- 📡 **Live Dashboard (Socket.io)** — Streams real-time updates:
  ```
  queued → analysing → completed / failed
  ```
- 📊 **Analytics Dashboard**
  - Code quality trends
  - Severity breakdown
  - File heatmaps
  - Developer leaderboard
- 👍 **Feedback Loop** — Users can provide feedback (thumbs up/down) on each review comment. Feedback is stored in MongoDB and serves as the labeled training signal for the ML fine-tuning pipeline described below.

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

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Recharts, Socket.io-client
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Queue & Caching:** Redis + Bull
- **GitHub Integration:** Octokit, Webhooks
- **Real-time:** Socket.io
- **ML (in progress):** PyTorch, HuggingFace Transformers (`microsoft/codebert-base`)

## ⚡ Performance Highlights

- ⚡ Sub-10ms webhook response time
- 🔄 Asynchronous PR processing using workers
- 📈 Scalable event-driven design

---

## 🔮 Roadmap: ML-Powered Review Classification (CodeBERT Fine-Tuning)

The static analysis engine currently flags issues using deterministic rules (regex/AST pattern matching). This produces high recall but a non-trivial false-positive rate — not every `console.log` or TODO is worth surfacing to a reviewer. The next phase fine-tunes **CodeBERT** to act as a learned relevance filter on top of the static rules, using the existing 👍/👎 feedback loop as the label source.

### 1. Task Definition

Rather than a vague "ML-based code analysis," the task is scoped precisely:

- **Primary task — Issue-validity classification:** given a flagged snippet + its issue category, predict the probability that a reviewer will find the comment useful (binary: accept / reject). This directly reuses the feedback already collected in MongoDB — no separate labeling effort required.
- **Stretch task — Issue-type classification:** bug / smell / optimization / style, once sufficient label diversity is available.

**Input format:**
```
[CLS] issue_category: hardcoded_secret [SEP] <3 lines before><flagged line><3 lines after> [SEP]
```

### 2. Data Pipeline

- **Label source:** 👍 = 1 (valid), 👎 = 0 (false positive), sourced directly from the feedback collection.
- **Cold-start handling:** Real feedback will be sparse early on. Bootstrap with public datasets (CodeXGLUE, Microsoft `CodeReviewer` dataset, Defects4J) for domain-adaptive pretraining, and generate synthetic weak labels by programmatically injecting debug logs / secrets / TODOs into clean OSS repositories.
- **Split strategy:** Train/validation/test splits are grouped **by repository and PR, not by row.** Random row-level splitting leaks style/author information across splits and inflates reported metrics — this is treated as a hard requirement, not an optimization.
- **Class imbalance:** Addressed with weighted cross-entropy / focal loss; reported per-class precision, recall, and F1 rather than raw accuracy.

### 3. Fine-Tuning Approach

- Base model: `microsoft/codebert-base`, fine-tuned via HuggingFace `Trainer`.
- Small learning rate (2e-5) with warmup to avoid destroying pretrained code representations.
- **Gradual unfreezing / discriminative fine-tuning:** classification head + top layers trained first; lower transformer layers unfrozen progressively as more data becomes available — mitigates overfitting on an initially small dataset.
- **Grouped k-fold cross-validation** (grouped by repo) instead of a single static split, to get variance estimates on a small dataset rather than one point estimate.
- Early stopping on validation **F1**, not loss, since loss can improve while minority-class performance degrades.

```python
from transformers import RobertaTokenizer, RobertaForSequenceClassification, TrainingArguments, Trainer

tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
model = RobertaForSequenceClassification.from_pretrained(
    "microsoft/codebert-base", num_labels=2
)

training_args = TrainingArguments(
    output_dir="./codebert-review-classifier",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    num_train_epochs=4,
    weight_decay=0.01,
    warmup_ratio=0.1,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="f1",
)
```

### 4. Evaluation Strategy

- **Baselines the fine-tuned model must beat:** (a) static rules alone, (b) zero-shot CodeBERT embeddings + logistic regression, (c) always-accept heuristic. Fine-tuning is only justified if it clearly outperforms (b).
- **Calibration, not just accuracy:** since predictions gate what reviewers see, confidence must be trustworthy — tracked via Expected Calibration Error (ECE), with temperature scaling applied if needed.
- **Ablations:** with/without domain-adaptive pretraining, with/without synthetic data augmentation, with/without the issue-category token in the input.
- **Manual spot-checks:** periodic human review of low-confidence predictions to catch systematic failure modes that aggregate metrics miss.

### 5. Safe Feedback Loop Closure

Training only on organically flagged-and-reviewed comments risks **feedback bias** — the model never learns from issues it never surfaced in the first place. Mitigations:

- Periodic sampling of *unflagged* code for review, to catch false negatives.
- Active learning: prioritize labeling low-confidence predictions rather than relying solely on organic feedback.
- **Shadow deployment:** the fine-tuned model runs in parallel with the static rules, logging disagreements, before it's allowed to gate which comments are actually posted.



## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/GopuRamakrishna/Code-Review-Assistant.git

# Backend setup
cd server
npm install
npm run dev

# Frontend setup
cd client
npm install
npm run dev
```

## 🤝 Contribution

Contributions are welcome! Feel free to open issues or submit pull requests.
