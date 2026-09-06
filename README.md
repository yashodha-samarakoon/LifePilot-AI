# LifePilot AI

**LifePilot AI** is a personal financial companion that helps users budget, set goals, evaluate major purchase decisions, and receive AI-driven financial guidance tailored to their profile. It combines a modern React frontend with Firebase for authentication and data persistence, and a local Express proxy that powers a Gemini-backed AI assistant.

---

## 🚀 Features

- **Secure Authentication** — Email/password and Google sign-in powered by Firebase Auth.
- **Guided Onboarding** — A low-friction flow that collects a user's name, age, occupation, country, currency, income, risk tolerance, and financial goal.
- **Personalised Dashboard** — Live financial snapshots, goal progress, smart insights, and a Financial Health Score.
- **AI Companion** — A conversational finance assistant that reads the user's profile and provides context-aware budgeting, saving, investing, and debt advice.
- **Decision Simulator** — Evaluate major purchases (vehicle, home, education, business) with affordability and risk analysis.
- **Expense Tracking** — Track transactions and automatically estimate monthly expenses from recent activity.
- **Goal Management** — Create, edit, and monitor financial goals with target amounts and deadlines.
- **Chat History Persistence** — Conversations are saved to Firestore so they survive refresh and device changes.

---

## 🏗️ Tech Stack

| Layer        | Technology                                            |
|--------------|-------------------------------------------------------|
| Frontend     | React 18, Vite 6, React Router v6                     |
| Styling      | Tailwind CSS 3.4                                      |
| State        | Zustand                                               |
| Auth & DB    | Firebase Authentication, Cloud Firestore              |
| AI           | Google Gemini (Generative Language API)               |
| AI Proxy     | Node.js + Express (keeps API key server-side)         |
| Build / DX   | Vite, ESLint, `concurrently`                          |

---

## 📁 Project Structure

```
lifepilot-ai/
├── public/                 # Static assets
├── server/
│   └── index.js            # Gemini proxy (keeps API key out of the browser)
├── src/
│   ├── components/         # Shared UI components (Button, Card, Badge, etc.)
│   ├── features/           # Feature modules
│   │   ├── auth/           # Login, signup, protected routes
│   │   ├── chat/           # AI Companion UI
│   │   ├── dashboard/      # Main dashboard
│   │   ├── decision-simulator/
│   │   ├── goals/
│   │   ├── insights/
│   │   ├── journey/
│   │   ├── onboarding/
│   │   ├── opportunity/
│   │   └── settings/
│   ├── lib/                # Utilities, constants, scoring, helpers
│   ├── services/           # Firebase, auth, firestore, chat, context services
│   ├── stores/             # Zustand stores (auth, user, chat, dashboard)
│   ├── App.jsx             # Routing and app shell
│   └── main.jsx            # Entry point
├── .env                    # Local-only config (Firebase + Gemini keys)
├── .env.example            # Example environment file
├── firestore.rules         # Firestore security rules
├── firebase.json           # Firebase hosting / deployment config
├── vite.config.js          # Vite config with /api proxy
└── package.json
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18 or newer
- A Firebase project with **Authentication** (Email/Password + Google) and **Firestore in Native mode**
- A Google Gemini API key

### 1. Clone the repo

```bash
git clone https://github.com/yashodha-samarakoon/LifePilot-AI.git
cd lifepilot-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root (it is already listed in `.gitignore`):

```env
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Gemini (server-side only — used by server/index.js)
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Start the app

Start the Vite frontend **and** the Gemini proxy together:

```bash
npm run dev:all
```

- Frontend: http://localhost:5177
- Gemini proxy: http://localhost:3001

---

## 🤖 AI Integration

The AI Companion is powered by **Google Gemini**. To keep the API key out of the browser, the app uses a small Express proxy:

1. The browser calls `/api/chat` (proxied to the Express server by Vite).
2. `server/index.js` injects the user's profile (name, age, income, country, risk tolerance, financial goal, goals list) into the Gemini system prompt.
3. Gemini returns a personalised response that is rendered in the chat UI.
4. Every user and AI message is also saved to Firestore under the user's document, so conversations persist across sessions.

The system prompt explicitly tells the model **not to ask for information that is already stored**, so the assistant feels contextual rather than repetitive.

---

## 🔒 Security

- `.env` is **never committed** to Git (see `.gitignore`).
- The Gemini API key is stored only on the server and never exposed to the browser.
- Firestore security rules scope all reads and writes to the authenticated user (`users/{uid}` and `users/{uid}/**`).
- Firebase Auth sessions are handled by the Firebase SDK with built-in CSRF and XSS protections.

---

## 🌐 Deployment

The frontend can be deployed to any static host:

```bash
npm run build
```

The `dist/` folder can then be deployed to **Vercel**, **Netlify**, **GitHub Pages**, or **Firebase Hosting**. The Gemini proxy can be deployed as a **Cloud Run** service, **Vercel serverless function**, or Firebase Cloud Function.

---

## 🧪 Testing

- Register a new account and verify the Firestore user document is created under `users/{uid}`.
- Log in again and confirm the dashboard loads the profile without re-running onboarding.
- Ask the AI Companion a finance question and confirm the response references your profile data.
- Refresh the chat page and confirm previous messages are still loaded.

---

## 📄 License

This project is intended for academic and personal use.
