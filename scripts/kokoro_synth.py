#!/usr/bin/env python3
"""
kokoro_synth.py — local TTS synthesis for fumii's hardware speaker path.

KokoroTTSService.ts spawns this script and reads raw PCM16 mono 16kHz audio
from stdout. This is a STUB: it wires up the CLI contract that side expects
but does not vendor the actual Kokoro model (kokoro-onnx / kokoro pip
package + ~300MB of weights don't belong in a source zip).

To make this real:
    pip install kokoro-onnx soundfile numpy
    # download the kokoro-v0_19.onnx + voices.bin per kokoro-onnx's README
    # then replace the NotImplementedError block below with an actual call:
    #
    #   from kokoro_onnx import Kokoro
    #   kokoro = Kokoro("kokoro-v0_19.onnx", "voices.bin")
    #   samples, sample_rate = kokoro.create(text, voice="af_sarah")
    #   # resample to 16000 mono if needed, convert float32 -> int16, write to stdout

See CLAUDE_CODE_PROMPT.md -> "Kokoro TTS gap" for the full checklist.
"""
import argparse
import sys


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--format", default="pcm16")
    args = parser.parse_args()

    sys.stderr.write(
        "[kokoro_synth.py] STUB — no model wired up yet. "
        "See this file's docstring for setup steps.\n"
    )
    raise NotImplementedError(
        "Kokoro model not installed. This stub intentionally fails loudly "
        "instead of returning silence, so KokoroTTSService's catch-and-"
        "fall-back-to-Web-Speech-API path is exercised correctly until a "
        "real model is wired in."
    )


if __name__ == "__main__":
    main()
