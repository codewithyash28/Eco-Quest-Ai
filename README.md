<p align="center">
  <img src="https://img.shields.io/badge/Project-Eco--Quest%20AI-34d399?style=for-the-badge&logo=leaflet&logoColor=white" />
</p>

<h1 align="center">🌍 Eco‑Quest AI</h1>

<p align="center">
  An intelligent environmental impact guide and sustainability coach that helps you track, reduce, and gamify your eco‑friendly journey.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-success?style=flat-square" />
  <img src="https://img.shields.io/badge/built_with-Typescript-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/powered_by-Gemini_AI-10b981?style=flat-square" />
</p>

---

## 🌱 What is Eco‑Quest AI?

Eco‑Quest AI is your personal sustainability companion that turns everyday actions into an eco‑friendly quest.  
It helps users understand their environmental footprint, suggests greener alternatives, and rewards consistent, conscious choices with a gamified experience.

---

## ✨ Key Features

- Smart eco coach: Get AI‑powered guidance on how to reduce your daily carbon impact.
- Impact tracking: Log activities like transport, energy use, and lifestyle habits in a simple, friendly interface.
- Gamified journey: Unlock levels, badges, and streaks as you build sustainable habits.
- Personalized tips: Receive suggestions tailored to your current lifestyle and goals.
- Eco challenges: Take on mini‑challenges (like “Low‑Plastic Week” or “Car‑Free Day”) to stay motivated.

---

## 🧠 How It Works (Concept)

- The app takes user inputs about daily actions (travel, food, energy, etc.).
- It uses an AI model (via the Gemini API) to:
  - Estimate environmental impact in a simple way (no hardcore scientific UI, just understandable insights).
  - Suggest practical, achievable improvements.
  - Maintain a narrative of your “Eco‑Quest” so it feels like a game, not a lecture.

You can customize prompts, categories, and challenge flows inside the code to match different audiences (students, families, office workers, etc.).

---

## 📸 UI Preview (replace with your images later)

> Add screenshots or GIFs of your app in this section once your UI is ready.

- `screenshot-1.png` – Home screen / Dashboard  
- `screenshot-2.png` – Eco coach chat  
- `screenshot-3.png` – Progress / badges view

```text
Place the images in the repo (for example in /public or /assets) and then
link them like:

```

---

## 🚀 Getting Started

### 1️⃣ Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### 2️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/codewithyash28/Eco-Quest-Ai.git
cd Eco-Quest-Ai

# Install dependencies
npm install
```

### 3️⃣ Environment Setup

Create a `.env.local` file in the project root and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

You can use `.env.example` as a reference.

### 4️⃣ Run in Development

```bash
npm run dev
```

Then open the local URL shown in your terminal (usually `http://localhost:5173/`).

---

## 📦 Project Structure (High‑Level)

```bash
Eco-Quest-Ai/
├─ src/          # Main application source code (components, logic, styling)
├─ index.html    # App entry HTML
├─ package.json  # Scripts and dependencies
├─ tsconfig.json # TypeScript configuration
└─ vite.config.ts# Vite bundler configuration
```

You can explore `src/` to tweak the UI, flows, and AI prompts to match your eco‑story.

---

## 🛠️ Scripts

Common scripts available in `package.json`:

- `npm run dev` – Start the development server
- `npm run build` – Build the app for production
- `npm run preview` – Preview the production build locally

---

## 🌍 Future Ideas

- Social leaderboard for eco‑scores with friends.
- Location‑aware tips (local pollution levels, public transport options, etc.).
- Deeper analytics with charts for weekly/monthly impact.
- Multi‑language support for a more global eco‑community.

---

<p align="center">
  <sub>Made with ❤️ by <strong>code with yash</strong></sub>
</p>
