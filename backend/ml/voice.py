from faster_whisper import WhisperModel

_model = WhisperModel("medium", device="cuda", compute_type="float16")

def transcribe(audio_path: str, language: str = "hi"):
    segments, info = _model.transcribe(audio_path, language=language)
    text = " ".join(seg.text for seg in segments)
    return {"transcript": text.strip(), "detected_language": info.language}
