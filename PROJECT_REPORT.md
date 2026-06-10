# Technical Report on AI Code Review Platform

## 1. Abstract

This project is an AI-assisted code review platform that automates the analysis of GitHub pull requests, identifies potential issues, and presents the results through a real-time dashboard. The system combines a Node.js backend, a React frontend, a MongoDB persistence layer, a Redis-backed review queue, WebSocket-based live updates, and a Python FastAPI machine learning service. Its main objective is to reduce manual review effort by detecting rule-based issues and AI-generated bug patterns as soon as a pull request is opened or updated.

## 2. Introduction

Modern software teams rely on fast, reliable code review workflows to maintain code quality. As repositories grow and pull requests arrive frequently, manual review becomes time-consuming and inconsistent. This project addresses that problem by automating the initial review stage and surfacing findings in a structured dashboard.

The platform listens to GitHub webhook events, stores pull request metadata in MongoDB, enqueues review jobs in Redis, processes changed files in the background, runs static review rules and ML-based analysis, and then posts feedback back to GitHub. At the same time, the frontend provides live status updates, a pull request list, detailed findings, and analytics for quality tracking.

## 3. Objectives

The main objectives of the project are:

* Automatically detect and review incoming pull requests from GitHub.
* Flag common code quality issues such as console statements, debugger usage, TODO comments, and possible hardcoded secrets.
* Use machine learning to identify additional bug-like patterns in code snippets.
* Present review results in a live dashboard with pull request details and analytics.
* Support scalable background processing so multiple pull requests can be handled reliably.

## 4. System Architecture

The project follows a distributed client-server architecture with a separate AI analysis service.

### 4.1 Frontend Layer

The frontend is built with React and Vite. It provides:

* A pull request list view.
* A pull request details page with filtered findings.
* An analytics dashboard with charts and summary cards.
* Live connection status through Socket.io.

### 4.2 Backend Layer

The backend is implemented with Node.js and Express. It handles:

* GitHub webhook verification and event ingestion.
* Pull request persistence in MongoDB.
* Background review processing with Bull.
* GitHub API integration for reading pull request files and posting comments.
* Real-time dashboard events using Socket.io.

### 4.3 Data Layer

MongoDB stores pull request records, review findings, status values, and user feedback on findings. A compound index on repository name and pull request number prevents duplicate records.

### 4.4 Queue and Worker Layer

Redis is used by Bull as the queue backend. A dedicated worker consumes review jobs, fetches changed files, applies rule-based checks, optionally calls the AI service, and updates the database and GitHub.

### 4.5 Machine Learning Layer

The ML service is a separate Python FastAPI application. It loads a CodeBERT-based classifier once at startup and exposes endpoints for health checks and code analysis.

### 4.6 Communication Flow

1. GitHub sends a pull request webhook event.
2. The backend verifies the webhook and stores the pull request in MongoDB.
3. A review job is placed in the queue.
4. The worker fetches changed files from GitHub.
5. The rule engine and ML service analyze changed code.
6. Findings are saved, GitHub comments are posted, and live dashboard events are emitted.
7. The frontend updates instantly through Socket.io.

## 5. Technologies Used

* Frontend: React 19, React Router, Vite, Axios, Recharts, React Hot Toast, Socket.io Client.
* Backend: Node.js, Express 5, Socket.io, Bull, Redis, Mongoose, CORS, dotenv.
* Database: MongoDB.
* External Integration: GitHub REST API and GitHub webhooks.
* AI Service: Python, FastAPI, PyTorch, Transformers, CodeBERT.
* Version Control: Git and GitHub.

## 6. Major Modules

### 6.1 Webhook Ingestion Module

This module receives GitHub webhook payloads at the `/api/webhooks/github` endpoint, verifies the request, and reacts to `pull_request` events such as `opened` and `synchronize`.

### 6.2 Pull Request Persistence Module

Pull request metadata is saved immediately in MongoDB so the dashboard can reflect new activity before the full analysis is complete. Fields include repository name, pull request number, title, author, status, line count changes, file count changes, and findings.

### 6.3 Review Queue and Worker Module

The queue decouples webhook handling from heavy analysis. The worker processes jobs in parallel, fetches changed files from GitHub, parses diffs, applies rules, optionally runs ML analysis, posts review comments, and updates status.

### 6.4 Rule Engine Module

The rule engine scans added lines in changed files for known patterns. Current checks include:

* `console.log`, `console.warn`, `console.error`, and `console.info` usage.
* `debugger` statements.
* TODO, FIXME, HACK, or XXX comments.
* Possible hardcoded secrets in assignments.

### 6.5 ML Analysis Module

The ML service chunks source code, runs each chunk through a CodeBERT classifier, and returns bug-oriented findings above a configurable confidence threshold. The Node.js backend merges these results with rule-based findings.

### 6.6 Dashboard and Analytics Module

The frontend provides:

* Pull request cards with review status and file counts.
* A detail page with severity filters and feedback controls.
* Analytics charts for trend, severity, leaderboard, and flagged file frequency.

## 7. Implementation Details

### 7.1 Backend Implementation

The backend starts by connecting to MongoDB, attaching Socket.io to the HTTP server, registering webhook routes, and loading the Bull review worker. The webhook controller stores or updates the pull request, then enqueues a background job with repository and commit information.

### 7.2 Diff Parsing and Rule Evaluation

Changed files are fetched from GitHub as patch data. The diff parser extracts added lines and their line numbers, then the rule engine evaluates each line against the configured static checks. This keeps the review focused on the new code introduced by a pull request.

### 7.3 ML Integration

If the ML service is reachable, the worker sends the added code to the FastAPI `/analyze` endpoint. The ML response is converted into dashboard findings and separate GitHub comments so the system can provide both deterministic rule checks and probabilistic bug detection.

### 7.4 Real-Time Updates

Socket.io broadcasts review events such as queued, started, progress, complete, and failed. The frontend subscribes to these events and updates the pull request list without requiring a page refresh.

### 7.5 Feedback Capture

Each finding can be marked as helpful or not helpful from the UI. This feedback is stored with the finding record, which supports future tuning of the review logic.

## 8. Methodology

The development of the AI Code Review Platform followed a structured and systematic approach to ensure reliability, responsiveness, and extensibility. The methodology combined software engineering practices with event-driven and AI-assisted processing. The project was developed in multiple stages, including requirement analysis, architecture design, implementation, testing, and deployment preparation.

### 8.1 Development Approach

An incremental development approach was used so that the ingestion pipeline, worker logic, dashboard, and ML service could be built and validated independently before integration. Each module was kept loosely coupled to simplify maintenance and future expansion.

### 8.2 Requirement Analysis

The requirements were grouped into functional and non-functional areas.

* Functional requirements: ingest GitHub pull request events, queue review jobs, analyze changed code, generate findings, post GitHub comments, and show results in a dashboard.
* Non-functional requirements: low-latency status updates, background processing, scalability, fault tolerance, and maintainable code structure.

### 8.3 System Design

A client-server architecture was chosen because it cleanly separates UI concerns from review processing. Real-time communication was added with Socket.io so the dashboard could reflect queue progress and review completion immediately. A queue-based design was used to prevent webhook requests from blocking while analysis is running.

### 8.4 Implementation

* The frontend was implemented in React with routed pages for pull requests and analytics.
* The backend was implemented in Node.js and Express with MongoDB for persistence.
* Bull and Redis were used to handle asynchronous review jobs.
* The ML service was implemented in Python with FastAPI and a CodeBERT classifier.

### 8.5 Testing and Validation

The platform can be validated at several levels:

* Webhook handling can be tested with sample GitHub events.
* Queue processing can be verified through worker logs and database updates.
* Dashboard behavior can be checked through live Socket.io updates.
* ML inference can be tested independently using the FastAPI health and analyze endpoints.

### 8.6 Deployment Considerations

The application is designed to run as separate services: frontend, backend, database, Redis queue, and ML API. This separation makes it easier to scale individual layers and deploy them independently in a cloud environment.

## 9. Challenges Faced

### 9.1 Webhook Reliability

GitHub webhook events must be verified and processed quickly to avoid timeout issues. The solution was to acknowledge the webhook immediately and continue the heavy work in the background.

### 9.2 Asynchronous Processing

Review jobs can take time because they require repository access, diff parsing, rule execution, and optional ML inference. Using a queue prevented the request pipeline from blocking.

### 9.3 ML Service Availability

The AI service may be unavailable or slow to start, especially when loading a large transformer model. The worker checks health before using it and falls back to static rule analysis if needed.

### 9.4 Accurate Diff Positioning

Posting inline GitHub comments requires correct file paths and line numbers. The diff parser and review comment formatting were designed to preserve the right metadata.

## 10. Performance Analysis

The architecture improves responsiveness by separating real-time UI updates from heavy analysis. Key performance characteristics include:

* Immediate webhook acknowledgment.
* Parallel job processing through the Bull queue.
* Live client updates without polling.
* Cached ML model loading at startup instead of per request.

This design supports multiple simultaneous pull requests while keeping the dashboard responsive.

## 11. Security Considerations

* GitHub webhook verification is used to avoid unauthorized event injection.
* Environment variables store sensitive configuration such as GitHub tokens, MongoDB URL, and ML service settings.
* The review queue isolates background work from the public webhook entry point.
* CORS is explicitly configured for the frontend origin.

## 12. Future Enhancements

Possible improvements for the platform include:

* Authentication and role-based access control.
* More advanced code intelligence models beyond the current CodeBERT classifier.
* Support for additional languages and repository types.
* Inline diff navigation and richer finding explanations.
* Custom organization-wide review rules.
* Trend alerts and quality gates for pull request approval.

## 13. Conclusion

The AI Code Review Platform demonstrates a practical way to combine traditional static analysis, asynchronous processing, and machine learning in a single review workflow. The system captures GitHub pull request events, analyzes code changes, stores results in a database, notifies users in real time, and presents actionable insights through a clean dashboard. Its modular design makes it suitable for real-world expansion and future integration with more advanced review intelligence.