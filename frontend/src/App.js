// src/App.js
import React, { useState, useRef } from "react";
import "./index.css";

import { LoginPage } from "./figma-ui/components/LoginPage";
import { HomePage } from "./figma-ui/components/HomePage";
import { DashboardPage } from "./figma-ui/components/DashboardPage";

function App() {
  // App routing: login -> home -> dashboard
  const [currentPage, setCurrentPage] = useState("login"); // 'login' | 'home' | 'dashboard'

  // recording + backend state
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordingData, setHasRecordingData] = useState(false);

  const [connectedDevices, setConnectedDevices] = useState([
    {
      id: "1",
      name: "Teacher Device",
      status: "connected",
      type: "teacher",
      audioLevel: 0,
    },
  ]);

  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");      // ✅ fixed
  const [notes, setNotes] = useState([]);         // array of strings
  const [flashcards, setFlashcards] = useState([]); // array of {id, front, back}
  const [isSummarizing, setIsSummarizing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const levelIntervalRef = useRef(null);

  // --- fake audio level animation for devices (UI only) ---
  const startAudioLevelSimulation = () => {
    if (levelIntervalRef.current) return;

    levelIntervalRef.current = setInterval(() => {
      setConnectedDevices((prev) =>
        prev.map((device) => ({
          ...device,
          audioLevel:
            device.type === "teacher"
              ? 60 + Math.random() * 40
              : Math.random() * 40,
        }))
      );
    }, 200);
  };

  const stopAudioLevelSimulation = () => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    setConnectedDevices((prev) =>
      prev.map((device) => ({ ...device, audioLevel: 0 }))
    );
  };

  // --- BACKEND CALLS ---

  const sendToBackend = async (audioBlob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  try {
    const response = await fetch("http://127.0.0.1:5000/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.text) {
      const text = data.text;
      setTranscript(text);
      setHasRecordingData(true);

      // ---- NOTES: first few sentences ----
      const sentences = text
        .split(/[.!?]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      setNotes(sentences.slice(0, 6));

      // ---- FLASHCARDS: auto from transcript ----
      const flashSentences = sentences.slice(0, 8); // up to 8 cards
      const generatedFlashcards = flashSentences.map((s, idx) => ({
        id: idx + 1,
        front: `Important point ${idx + 1}`,
        back: s,
      }));

      setFlashcards(generatedFlashcards);
    } else if (data.error) {
      console.error("Transcribe error:", data.error);
      alert("Error while transcribing audio");
    }
  } catch (err) {
    console.error("Network error:", err);
    alert("Could not reach backend for transcription");
  }
};


  const handleSummarize = async () => {
    if (!transcript || isSummarizing) return;
    setIsSummarizing(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });

      const data = await response.json();
      if (data.summary) {
        const sum = data.summary;
        setSummary(sum);

        // build flashcards from bullet point summary (each line)
        const lines = sum
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const generatedFlashcards = lines.map((line, idx) => {
          const clean = line.startsWith("•") ? line.slice(1).trim() : line;
          return {
            id: idx + 1,
            front: `Key idea ${idx + 1}`,
            back: clean,
          };
        });

        setFlashcards(generatedFlashcards);
      } else if (data.error) {
        console.error("Summarize error:", data.error);
        alert("Error while summarizing");
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Could not reach backend for summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!summary) {
      alert("Generate a summary first.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Lecture_Notes.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Could not download PDF");
    }
  };

  // --- RECORDING HANDLERS ---

  const handleStartRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // stop mic stream
        stream.getTracks().forEach((track) => track.stop());

        // send to backend for transcription
        await sendToBackend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      startAudioLevelSimulation();
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Could not access your microphone");
    }
  };

  const handleStopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    setIsRecording(false);
    stopAudioLevelSimulation();
    mediaRecorderRef.current.stop();
  };

  // --- OTHER HELPERS ---

  const handleAddDevice = (deviceName) => {
    setConnectedDevices((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: deviceName,
        status: "connected",
        type: "student",
        audioLevel: 0,
      },
    ]);
  };

  const goToDashboard = () => setCurrentPage("dashboard");
  const goToHome = () => setCurrentPage("home");

  // --- RENDER ---

  return (
    <>
      {currentPage === "login" && (
        <LoginPage onLoginSuccess={() => setCurrentPage("home")} />
      )}

      {currentPage === "home" && (
        <HomePage
          isRecording={isRecording}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onNavigateToDashboard={goToDashboard}
          connectedDevices={connectedDevices}
          onAddDevice={handleAddDevice}
          hasRecordingData={hasRecordingData}
        />
      )}

      {currentPage === "dashboard" && (
        <DashboardPage
          onNavigateToHome={goToHome}
          hasRecordingData={hasRecordingData}
          transcript={transcript}
          summary={summary}
          notes={notes}
          flashcards={flashcards}
          onSummarize={handleSummarize}
          isSummarizing={isSummarizing}
          onDownloadPdf={handleDownloadPdf}
        />
      )}
    </>
  );
}

export default App;
