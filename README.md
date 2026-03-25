Audique – AI Powered Speech-to-Text Notes Generator

Audique is an AI-driven web application that converts spoken lectures and audio content into accurate transcripts, structured notes, summaries, and flashcards in real time.
The platform is designed to enhance classroom learning, accessibility, and productivity by reducing the need for manual note-taking and making audio content searchable and easy to understand.

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
