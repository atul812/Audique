Audique – AI Powered Speech-to-Text Notes Generator

Audique is an AI-driven web application that converts spoken lectures and audio content into accurate transcripts, structured notes, summaries, and flashcards in real time.
The platform is designed to enhance classroom learning, accessibility, and productivity by reducing the need for manual note-taking and making audio content searchable and easy to understand.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Running Locally](#-running-locally)
- [System Architecture](#️-system-architecture-overview)
- [Results & Impact](#-results--impact)

🚀 Features

Real-Time Speech to Text – High-accuracy lecture transcription

Automatic Note Generation – Converts transcripts into structured notes

Smart Summaries – Extracts key points for quick revision

Flashcard Creation – Helps with memory retention and exam preparation

Collaborative Learning – Multi-student access to shared materials

Browser-Based Audio Recording – Seamless in-app recording with waveform visualization

Secure Authentication – User login and session management

Scalable Architecture – Designed for performance and reliability

🧠 Problem Statement

Students often miss important information during lectures due to:

Fast-paced teaching

Background noise

Lack of note-taking time

Accessibility challenges

Audique addresses these issues by automatically capturing and organizing lecture content into meaningful study materials.

🏗️ Tech Stack
Frontend

React

Tailwind CSS

MediaRecorder API

TypeScript / JavaScript

HTML & CSS

Backend

Flask (Python) APIs

Audio Processing Modules

Session Management

AI / Machine Learning

Whisper Speech Recognition

Groq LLMs (LLaMA / Mixtral)

Hugging Face Models

Authentication & Deployment

Supabase Authentication

Render Deployment

## 🛠️ Installation & Setup

### Prerequisites

Before you begin, make sure you have the following installed on your local machine:

- **Git** - For cloning the repository ([Download Git](https://git-scm.com/))
- **Python 3.8+** - Required for the backend ([Download Python](https://www.python.org/downloads/))
- **Node.js 16+** & **npm** (or yarn) - Required for the frontend ([Download Node.js](https://nodejs.org/))
- **pip** - Python package manager (usually comes with Python)
- **Virtual Environment** - For Python dependency isolation
- **API Keys Required**:
  - **Groq API Key** - For speech recognition and LLM processing ([Get API Key](https://console.groq.com/keys))
  - **Supabase Project URL & Anon Key** - For authentication and database ([Create Supabase Project](https://supabase.com/))

### Step 1: Clone the Repository

Open your terminal and run the following command to clone the project:

```bash
git clone https://github.com/atul812/Audique.git
cd Audique
```

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory

```bash
cd backend
```

#### 2.2 Create and Activate Virtual Environment

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

#### 2.3 Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 2.4 Configure Environment Variables

Create a `.env` file in the `backend/` directory with the following content:

```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
FLASK_ENV=development
```

**How to get your API keys:**
1. **Groq API Key**: Go to [Groq Console](https://console.groq.com/keys) → Create an API key
2. **Supabase Keys**: Go to your [Supabase Project](https://app.supabase.com/) → Settings → API → Copy your URL and anon key

#### 2.5 Run the Backend Server

```bash
python app.py
```

The backend will run at `http://localhost:5000`

You should see:
```
 * Running on http://127.0.0.1:5000
```

### Step 3: Frontend Setup (New Terminal/Tab)

#### 3.1 Navigate to Frontend Directory

```bash
cd frontend
```

**Note:** Make sure you're in a new terminal window/tab with the backend still running in the original terminal.

#### 3.2 Install Node Dependencies

```bash
npm install
```

Or if you use yarn:
```bash
yarn install
```

#### 3.3 Configure Frontend Environment (if needed)

The frontend is already configured to proxy API requests to the backend at `http://127.0.0.1:5000` (see `frontend/package.json`'s proxy field).

#### 3.4 Run the Frontend Development Server

```bash
npm start
```

Or with yarn:
```bash
yarn start
```

The frontend will automatically open at `http://localhost:3000`

## 🚀 Running Locally

Now you have both servers running:

- **Frontend**: `http://localhost:3000` - The web interface
- **Backend**: `http://localhost:5000` - The API server

### Complete Setup Checklist

- [ ] Git and repository cloned
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ and npm installed
- [ ] Backend virtual environment created and activated
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created in `backend/` with API keys
- [ ] Backend server running on port 5000
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend development server running on port 3000
- [ ] Browser opened to `http://localhost:3000`

### Troubleshooting

**Backend Port Already in Use:**
```bash
# Kill the process on port 5000 (macOS/Linux)
lsof -ti:5000 | xargs kill -9
# Or change the port in app.py
```

**Frontend Port Already in Use:**
```bash
# Kill the process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9
# Or set a custom port
PORT=3001 npm start
```

**ModuleNotFoundError in Backend:**
Ensure virtual environment is activated:
```bash
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

**Missing Dependencies:**
Update pip and reinstall:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Supabase Connection Issues:**
- Verify your SUPABASE_URL and SUPABASE_KEY are correct
- Check that your Supabase project is active
- Ensure firewall isn't blocking connections

⚙️ System Architecture Overview

User records or uploads audio through the browser interface

Audio is sent to the backend server

AI models transcribe speech into text

LLMs process the transcript to generate:

Notes

Summaries

Flashcards

Processed content is displayed to the user in an organized format

📈 Results & Impact

Improved lecture comprehension

Faster revision with summarized content

Reduced dependency on manual note-taking

Enhanced accessibility for all learners

Scalable and collaborative study environment

📂 Project Structure (Example)
Audique/
│
├── frontend/        # React UI and recording interface
├── backend/         # Flask APIs and audio processing
├── models/          # AI/ML integration logic
├── assets/          # Images, icons, UI resources
└── README.md

🔐 Security

Secure user authentication using Supabase

Encrypted communication via HTTPS

Session-based access control

🎯 Objectives

Convert lecture audio into reliable text quickly

Automatically generate structured study materials

Provide a user-friendly browser-based interface

Improve learning efficiency and accessibility

Build a scalable AI-powered educational platform

🛠️ Future Improvements

Mobile application support

Multi-language transcription

Offline audio processing

Advanced analytics and insights

Integration with Learning Management Systems (LMS)

👥 Team

Atul Kumar

Avani Thumballi

Abhishek Kumar

Satwik Singh

📌 Conclusion

Audique demonstrates how Artificial Intelligence + Web Technologies can be combined to modernize classroom learning.
It transforms raw audio into meaningful educational content, making learning more efficient, collaborative, and accessible.
