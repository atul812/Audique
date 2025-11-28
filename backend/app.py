import os
import io
import tempfile
from pathlib import Path

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from groq import Groq
from fpdf import FPDF
from dotenv import load_dotenv
load_dotenv()

# -----------------------------------------------------------------------------
# App & CORS
# -----------------------------------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# -----------------------------------------------------------------------------
# Groq client (you'll set GROQ_API_KEY in .env / Render)
# -----------------------------------------------------------------------------
groq_client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

# -----------------------------------------------------------------------------
# Health check
# -----------------------------------------------------------------------------
@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Audique backend running"})


# -----------------------------------------------------------------------------
# /transcribe  -  uses Groq Whisper (replaces local openai-whisper)
# -----------------------------------------------------------------------------
@app.route("/transcribe", methods=["POST"])
def transcribe():
    """
    Expects: multipart/form-data with field 'audio'
    Returns: JSON { "text": "<transcript>" }
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files["audio"]

    if audio_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # Save the uploaded file to a temp path
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        temp_path = tmp.name
        audio_file.save(temp_path)

    try:
        # Groq Whisper transcription
        # Docs: uses whisper-large-v3 / turbo models for STT 
        with open(temp_path, "rb") as f:
            transcription = groq_client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=("recording.webm", f, audio_file.mimetype),
                response_format="json",
            )

        # SDK returns an object with `.text`
        text = getattr(transcription, "text", None)
        if text is None and isinstance(transcription, dict):
            text = transcription.get("text", "")

        if not text:
            return jsonify({"error": "Empty transcription from Groq"}), 500

        return jsonify({"text": text})

    except Exception as e:
        print("Groq transcription error:", e)
        return jsonify({"error": "Transcription failed"}), 500

    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


# -----------------------------------------------------------------------------
# /summarize  -  uses Groq Llama-3.1 (replaces any OpenAI GPT usage)
# -----------------------------------------------------------------------------
@app.route("/summarize", methods=["POST"])
def summarize():
    """
    Expects: JSON { "text": "<full transcript>" }
    Returns: JSON { "summary": "<summary text>" }
    """
    data = request.get_json(silent=True) or {}
    transcript_text = data.get("text", "")

    if not transcript_text.strip():
        return jsonify({"error": "No text provided"}), 400

    prompt = (
        "You are an AI assistant that writes clear, structured lecture summaries "
        "for students.\n\n"
        "Requirements:\n"
        "1. Only use information from the transcript.\n"
        "2. Use headings and bullet points where helpful.\n"
        "3. Keep it concise but cover all key ideas.\n\n"
        "Transcript:\n"
        f"{transcript_text}\n\n"
        "Now write the summary."
    )

    try:
        # Groq Llama 3.1 8B – fast, good for summaries 
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI that summarizes classroom lectures for students.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.2,
            max_tokens=800,
        )

        summary_text = completion.choices[0].message.content
        return jsonify({"summary": summary_text})

    except Exception as e:
        print("Groq summarize error:", e)
        return jsonify({"error": "Summary generation failed"}), 500


# -----------------------------------------------------------------------------
# /download-pdf  -  PDF export of summary (keeps your Summary → PDF button)
# -----------------------------------------------------------------------------
@app.route("/download-pdf", methods=["POST"])
def download_pdf():
    """
    Expects: JSON { "summary": "<summary text>" }
    Returns: PDF file download
    """
    data = request.get_json(silent=True) or {}
    summary = (data.get("summary") or "").strip()

    if not summary:
        return jsonify({"error": "No summary text provided"}), 400

    try:
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        for paragraph in summary.split("\n\n"):
            for line in paragraph.split("\n"):
                pdf.multi_cell(0, 8, txt=line)
            pdf.ln(4)

        pdf_bytes = pdf.output(dest="S").encode("latin-1")

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name="Lecture_Notes.pdf",
        )
    except Exception as e:
        print("PDF generation error:", e)
        return jsonify({"error": "Failed to generate PDF"}), 500


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    # For local dev; Render will use gunicorn app:app
    app.run(host="0.0.0.0", port=5000, debug=True)
