import os
import uuid
from io import BytesIO
from typing import Optional

from flask import Flask, request, jsonify, send_file
from fpdf import FPDF
import io
from flask_cors import CORS
from werkzeug.utils import secure_filename

import whisper
from transformers import pipeline
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from pydub import AudioSegment
import torch

from dotenv import load_dotenv
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------
UPLOAD_FOLDER = "temp"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024  # 50MB

# -------------------------------------------------------------------
# Supabase configuration
# -------------------------------------------------------------------
load_dotenv()  # load variables from .env if present

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "recordings")

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    print("✅ Supabase client initialized")
else:
    print(
        "⚠️ Supabase not fully configured "
        "(missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY). "
        "Audio will not be uploaded to cloud."
    )


def upload_audio_to_supabase(
    file_bytes: bytes,
    filename: str,
    content_type: Optional[str] = None,
) -> Optional[str]:
    """
    Upload raw audio bytes to Supabase Storage.
    Returns the storage path, or None on failure.
    Does NOT affect the normal API behaviour.
    """
    if supabase is None:
        # Supabase not configured; silently skip
        return None

    if not content_type:
        content_type = "audio/webm"

    safe_name = secure_filename(filename) if filename else "recording.webm"
    storage_path = f"recordings/{uuid.uuid4().hex}_{safe_name}"

    file_like = BytesIO(file_bytes)

    try:
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            file=file_like,
            path=storage_path,
            file_options={"content-type": content_type},
        )

        # Optional: store a metadata row if you created a `recordings` table
        try:
            supabase.table("recordings").insert(
                {"file_path": storage_path}
            ).execute()
        except Exception as e:
            print("Supabase DB insert failed:", e)

        print("✅ Uploaded audio to Supabase at", storage_path)
        return storage_path
    except Exception as e:
        print("Supabase upload failed:", e)
        return None


# -------------------------------------------------------------------
# Load models once at startup
# -------------------------------------------------------------------
print("🔥 Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("✅ Whisper loaded")

print("🔥 Loading summarization model...")
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn",
    device=0 if torch.cuda.is_available() else -1,
)
print("✅ Summarizer loaded")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file"}), 400

        file = request.files["audio"]
        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        # Read bytes once so we can upload them to Supabase
        file_bytes = file.read()
        # Reset stream so Flask can still work with it if needed
        file.stream.seek(0)

        # Save uploaded file using the original extension if available
        orig_name = secure_filename(file.filename)
        _, ext = os.path.splitext(orig_name)
        if not ext:
            ext = ".webm"

        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # 🔼 NEW: upload the original recording to Supabase (non-blocking)
        try:
            upload_audio_to_supabase(
                file_bytes=file_bytes,
                filename=file.filename,
                content_type=file.mimetype,
            )
        except Exception as e:
            # Do not break transcription if upload fails
            print("Error during Supabase upload:", e)

        # Convert to WAV for Whisper — let pydub detect the format
        wav_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}.wav")
        audio = AudioSegment.from_file(filepath)
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(wav_path, format="wav")

        # Transcribe with Whisper
        result = whisper_model.transcribe(wav_path)
        text = result["text"].strip()

        # Cleanup
        os.remove(filepath)
        os.remove(wav_path)

        return jsonify({"text": text})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        data = request.get_json()
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"summary": ""})

        # Split text into chunks if too long
        max_chunk = 1000
        chunks = []

        while len(text) > max_chunk:
            cutoff = text.rfind(".", 0, max_chunk)
            if cutoff == -1:
                cutoff = max_chunk
            chunks.append(text[:cutoff])
            text = text[cutoff:]
        chunks.append(text)

        # Summarize each chunk
        summaries = []
        for chunk in chunks:
            if len(chunk.strip()) < 50:  # Skip very short chunks
                continue

            result = summarizer(
                chunk,
                max_length=150,
                min_length=50,
                do_sample=False,
            )
            summaries.append(result[0]["summary_text"])

        # Format as bullet points
        bullet_summary = "\n".join([f"• {s}" for s in summaries])

        return jsonify({"summary": bullet_summary})

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/download-pdf", methods=["POST"])
def download_pdf():
    try:
        data = request.get_json()
        summary = (data.get("summary") or "").strip()

        if not summary:
            return jsonify({"error": "No summary text provided"}), 400

        # Create PDF in memory
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        # Simple wrapping: split by lines and paragraphs
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


if __name__ == "__main__":
    print("🚀 Backend running on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
