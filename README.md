# 📱 Smart Offline-First Attendance System

A resilient, privacy-first, web-based attendance gateway built to solve classroom roll-call overhead and internet dropout failures. By utilizing dynamic QR codes, offline client storage, and automatic background reconciliation, it preserves instructional time and prevents proxy fraud.

## 🚀 Key Features

* **Resilient Offline Mode:** Enables students to register attendance without network coverage. Verification receipts are securely buffered in the browser's local store and auto-sync when cellular/Wi-Fi connection is restored.
* **Anti-Proxy QR-OTP Protection:** Prevents remote check-ins. Renders a signed, ephemeral QR code that rotates every 10 seconds, requiring the student to physically scan the screen and match it with a live OTP.
* **IndexedDB & Cryptographic Storage:** Encrypts local payloads using the browser's Web Crypto API, storing them in IndexedDB before syncing to prevent local database tampering.
* **Timetable-Linked Session Orchestration:** Automatically pre-creates lecture slots based on the department timetable, letting lecturers activate the session window with a single click.
* **Privacy-First Design:** Bypasses location tracking (GPS) and intrusive biometric audits (facial scans), running purely on standard web camera feeds.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js (v5+), SQLite (`better-sqlite3`), Prisma ORM
* **Frontend:** Vanilla HTML5, CSS3, JavaScript (Mobile-First Web App)
* **Real-time Engine:** WebSockets (`ws`) and Server-Sent Events (SSE)
* **PWA Features:** Web App Manifest and Service Worker caching

---

## 📦 Project Structure

```text
📦 smart-attendance
 ┣ 📂 attendance-Backend     # Express + Prisma + SQLite backend
 ┣ 📂 attendance-FrontEnd    # Vanilla JS and HTML5 student & lecturer pages
 ┣ 📜 package.json           # Monorepo/workspace manifest
 ┗ 📜 README.md              # System documentation
```

---

## 🚦 Getting Started

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd attendance-Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Prisma and initialize database:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start the Express server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Start the Vite development frontend server from the root or navigate to the frontend resources:
   ```bash
   npm run dev
   ```
2. Open `index.html` (Vite host) or browse the local static client files:
   - Student Page: `student/Student.html`
   - Lecturer Page: `lecturer/Lecturer.html`
