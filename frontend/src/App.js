// src/App.js
import React, { useState, useRef } from "react";
import "./index.css";

import { supabase } from "./supabaseClient";

import { LoginPage } from "./figma-ui/components/LoginPage";
import { HomePage } from "./figma-ui/components/HomePage";
import { DashboardPage } from "./figma-ui/components/DashboardPage";

function App() {
  // App routing: login -> home -> dashboard
  const [currentPage, setCurrentPage] = useState("login");

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
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const levelIntervalRef = useRef(null);

  // --- fake audio level animation for devices ---
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
      prev.map((device) => ({
        ...device,
        audioLevel: 0,
      }))
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

        const sentences = text
          .split(/[.!?]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        setNotes(sentences.slice(0, 6));

        const flashSentences = sentences.slice(0, 8);
        const generatedFlashcards = flashSentences.map((s, idx) => ({
          id: idx + 1,
          front: `Important point ${idx + 1}`,
          back: s,
        }));

        setFlashcards(generatedFlashcards);
      } else if (data.error) {
        alert("Error while transcribing audio");
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Lecture_Notes.pdf";
      a.click();
    } catch (err) {
      console.error(err);
      alert("Could not download PDF");
    }
  };

  // --- RECORDING HANDLERS ---
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        stream.getTracks().forEach((t) => t.stop());

        await sendToBackend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      startAudioLevelSimulation();
    } catch (err) {
      alert("Could not access microphone");
    }
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    stopAudioLevelSimulation();
  };

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

  // ✅ shared logout handler used by Home + Dashboard
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage("login");
  };

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
          connectedDevices={connectedDevices}
          onAddDevice={handleAddDevice}
          hasRecordingData={hasRecordingData}
          onNavigateToDashboard={goToDashboard}
          onLogout={handleLogout}          // 🔴 added
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
          onLogout={handleLogout}          // still works in dashboard too
        />
      )}
    </>
  );
}

export default App;
