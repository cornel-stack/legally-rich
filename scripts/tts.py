#!/usr/bin/env python3
"""
Generate narration audio for an episode with edge-tts (Brian voice) and capture
per-word timings used to sync captions and visual beats.

Usage:
    python3 scripts/tts.py episodes/ep01-credit-card

Outputs, per scene <id>:
    episodes/<ep>/audio/<id>.mp3
    episodes/<ep>/audio/<id>.words.json   -> [{"t": start_s, "d": dur_s, "w": text}, ...]

Caching: a scene is re-synthesised only when its narration text (or voice/rate)
changes, keyed by a hash stored alongside the audio. This keeps CI fast and
deterministic.
"""
import asyncio
import hashlib
import json
import sys
from pathlib import Path

import edge_tts


def narration_hash(text: str, voice: str, rate: str) -> str:
    h = hashlib.sha256()
    h.update(f"{voice}|{rate}|{text}".encode("utf-8"))
    return h.hexdigest()[:16]


async def synth_scene(text: str, voice: str, rate: str, mp3_path: Path, words_path: Path) -> float:
    """Synthesize one scene; write mp3 + word timings. Returns duration (s)."""
    attempts = 0
    while True:
        attempts += 1
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
            words = []
            audio = bytearray()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio.extend(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    words.append(
                        {
                            "t": round(chunk["offset"] / 1e7, 3),
                            "d": round(chunk["duration"] / 1e7, 3),
                            "w": chunk["text"],
                        }
                    )
            if not audio:
                raise RuntimeError("no audio returned")
            mp3_path.write_bytes(bytes(audio))
            words_path.write_text(json.dumps(words, ensure_ascii=False, indent=0))
            # duration = end of last word + a small tail; refined later by ffprobe
            end = (words[-1]["t"] + words[-1]["d"]) if words else 0.0
            return end
        except Exception as exc:  # network blips against the MS endpoint are common
            if attempts >= 4:
                raise
            print(f"  retry {attempts} after error: {exc}")
            await asyncio.sleep(1.5 * attempts)


async def main(ep_dir: Path) -> None:
    case = json.loads((ep_dir / "case.json").read_text())
    voice = case.get("voice", "en-US-BrianNeural")
    rate = case.get("rate", "+6%")
    audio_dir = ep_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    for scene in case["scenes"]:
        sid = scene["id"]
        text = scene["narration"].strip()
        mp3 = audio_dir / f"{sid}.mp3"
        words = audio_dir / f"{sid}.words.json"
        stamp = audio_dir / f"{sid}.hash"
        want = narration_hash(text, voice, rate)
        if mp3.exists() and words.exists() and stamp.exists() and stamp.read_text().strip() == want:
            print(f"  cached  {sid}")
            continue
        print(f"  synth   {sid}  ({len(text)} chars)")
        await synth_scene(text, voice, rate, mp3, words)
        stamp.write_text(want)

    print("TTS done.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: tts.py <episode-dir>")
        sys.exit(1)
    asyncio.run(main(Path(sys.argv[1])))
