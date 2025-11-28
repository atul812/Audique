// frontend/src/App.js
import React, { useState } from "react";
import { ThemeProvider } from "./figma-ui/components/ThemeProvider";
import { HomePage } from "./figma-ui/components/HomePage";
import { DashboardPage } from "./figma-ui/components/DashboardPage";
import { FlashcardsView } from "./figma-ui/components/FlashcardsView";
import { SummaryView } from "./figma-ui/components/SummaryView";
import { NotesView } from "./figma-ui/components/NotesView";
import { TranscriptView } from "./figma-ui/components/TranscriptView";

// ✅ API Base URL for local + production
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordingData, setHasRecordingData] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [flashcards, setFlashcards] = useState([]);

  const [audioBlob, setAudioBlob] = useState(null);

  // Simulated devices (same as your version)
  const [connectedDevices, setConnectedDevices] = useState([
    {
      id: "1",
      name: "Teacher Device",
      type: "teacher",
      status: "connected",
      audioLevel: 0,
    },
  ]);

  // ----------------------- RECORDING FUNCTIONS -----------------------

  const handleStartRecording = async () => {
    setIsRecording(true);
    console.log("Recording started...");
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    console.log("Recording stopped");

    if (!audioBlob) {
      console.error("No audio recorded");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      // ---------------- TRANSCRIBE ----------------
      const transcribeRes = await fetch(`${API_BASE_URL}/transcribe`, {
        method: "POST",
        body: formData,
      });

      const transcribeData = await transcribeRes.json();
      setTranscript(transcribeData.transcript || "");
      setHasRecordingData(true);

      // ---------------- SUMMARY ----------------
      const summaryRes = await fetch(`${API_BASE_URL}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcribeData.transcript }),
      });

      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary || "");

      // ---------------- NOTES ----------------
      const notesRes = await fetch(`${API_BASE_URL}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcribeData.transcript }),
      });

      const notesData = await notesRes.json();
      setNotes(notesData.notes || "");

      // ---------------- FLASHCARDS ----------------
      const flashRes = await fetch(`${API_BASE_URL}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcribeData.transcript }),
      });

      const flashData = await flashRes.json();
      setFlashcards(flashData.flashcards || []);

      console.log("All processing complete");
    } catch (err) {
      console.error("Error processing:", err);
    }
  };

  // ----------------------- PAGE RENDERING -----------------------

  let pageComponent = null;

  if (currentPage === "flashcards") {
    pageComponent = (
      <FlashcardsView
        flashcards={flashcards}
        onNavigateBack={() => setCurrentPage("home")}
      />
    );
  } else if (currentPage === "summary") {
    pageComponent = (
      <SummaryView
        summary={summary}
        onDownloadPDF={async () => {
          const res = await fetch(`${API_BASE_URL}/download-pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary }),
          });

          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "summary.pdf";
          a.click();
        }}
        onNavigateBack={() => setCurrentPage("home")}
      />
    );
  } else if (currentPage === "notes") {
    pageComponent = (
      <NotesView
        notes={notes}
        onNavigateBack={() => setCurrentPage("home")}
      />
    );
  } else if (currentPage === "transcript") {
    pageComponent = (
      <TranscriptView
        transcript={transcript}
        onNavigateBack={() => setCurrentPage("home")}
      />
    );
  } else if (currentPage === "dashboard") {
    pageComponent = (
      <DashboardPage
        transcript={transcript}
        summary={summary}
        notes={notes}
        flashcards={flashcards}
        onNavigateBack={() => setCurrentPage("home")}
      />
    );
  } else {
    // HOME PAGE
    pageComponent = (
      <HomePage
        isRecording={isRecording}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        hasRecordingData={hasRecordingData}
        connectedDevices={connectedDevices}
        onAddDevice={() => {}}
        onNavigateToDashboard={() => setCurrentPage("dashboard")}
        onNavigateFlashcards={() => setCurrentPage("flashcards")}
        onNavigateSummary={() => setCurrentPage("summary")}
        onNavigateNotes={() => setCurrentPage("notes")}
        onNavigateTranscript={() => setCurrentPage("transcript")}
        setAudioBlob={setAudioBlob}
      />
    );
  }

  return <ThemeProvider>{pageComponent}</ThemeProvider>;
}
