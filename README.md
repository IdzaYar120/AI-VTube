# AI VTuber

**AI VTuber** is a voice-interactive AI companion that supports real-time voice conversations and visual perception, featuring a Live2D avatar. The application can run completely offline on your computer.

## Features

- **Cross-platform support**: Compatibility with macOS, Linux, and Windows.
- **Offline mode support**: Run completely offline using local models.
- **Attractive web and desktop clients**: Support for window mode and desktop pet mode (transparent background, global top-most).
- **Advanced interaction features**:
  - Visual perception (camera, screen recording, screenshots)
  - Voice interruption (VAD)
  - Touch feedback
  - Live2D expressions and emotion mapping
  - Audio streaming and playback management
- **Extensive model support**:
  - LLM: Ollama, OpenAI-compatible APIs, Claude, Gemini, GGUF, LM Studio, etc.
  - ASR: sherpa-onnx, FunASR, Faster-Whisper, Whisper.cpp, Azure ASR, etc.
  - TTS: sherpa-onnx, pyttsx3, MeloTTS, CosyVoice, GPT-SoVITS, Bark, Edge TTS, Fish Audio, Azure TTS, etc.

## Quick Start

### Installation

1. Install dependencies:
   ```bash
   uv sync
   ```
2. Run server:
   ```bash
   uv run run_server.py
   ```
   For verbose logging:
   ```bash
   uv run run_server.py --verbose
   ```

### Configuration

- **Main config file**: `conf.yaml`
- **Default configs**: `config_templates/conf.default.yaml`
- **Character configs**: `characters/`
