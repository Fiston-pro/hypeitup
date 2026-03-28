"""
HypeItUp — Modal app: Llama (or compatible instruct model) → strict JSON for Next.js.

Deploy:
  modal deploy modal/hypeitup_llama.py

Dev / ephemeral URL:
  modal serve modal/hypeitup_llama.py

Requires:
  - Modal account + `pip install modal` + `modal token new`
  - Hugging Face token with access to the chosen model (Llama is gated — accept the license on HF first)
  - Modal Secret named `huggingface` with env var HF_TOKEN (see SETUP_MODAL.md)

Swap MODEL_ID to another instruct model if you prefer (e.g. open ungated models).
"""

from __future__ import annotations

import json
import re
from typing import Any

import modal

# --- Model: Meta Llama 3.2 Instruct (gated — needs HF_TOKEN) ---
MODEL_ID = "meta-llama/Llama-3.2-3B-Instruct"
# Ungated alternative if you skip Llama license:
# MODEL_ID = "Qwen/Qwen2.5-3B-Instruct"

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.5.1",
        extra_index_url="https://download.pytorch.org/whl/cu124",
    )
    .pip_install(
        "transformers==4.46.3",
        "accelerate==1.1.1",
        "bitsandbytes>=0.44.0",
        "sentencepiece==0.2.0",
        "protobuf>=4.25",
        "fastapi[standard]==0.115.6",
    )
)

app = modal.App(name="hypeitup-generate")


def build_prompt(achievement: str, drama: int, buzz: str, length: str) -> str:
    length_hint = {
        "short": "2-3 short paragraphs total",
        "medium": "3-5 short paragraphs",
        "long": "5+ paragraphs, still readable on LinkedIn",
    }.get(length, "medium")
    buzz_hint = {
        "low": "minimal corporate jargon",
        "medium": "moderate LinkedIn buzzwords",
        "max": "maximum buzzwords, synergy, thought leadership, etc.",
    }.get(buzz, "medium")

    schema = """{
  "hook": "string — opening line, dead serious tone",
  "body": "string — main post, straight-faced absurdity",
  "hashtags": ["string", "..."],
  "cringe_score": 0,
  "share_title": "string — short title for sharing"
}"""

    return f"""You are a satire writer. Output a single JSON object ONLY — no markdown fences, no commentary.
The JSON must match this shape exactly (keys required):
{schema}

Rules:
- The user's "achievement" is mundane; the post must treat it like a world-changing milestone.
- Tone: polished LinkedIn influencer, fully straight-faced, absurdly self-important.
- drama_level is 1-10 (user asked {drama}); higher = more melodrama.
- Buzzword density: {buzz_hint}
- Length: {length_hint}
- cringe_score: 0-100 number reflecting how cringe the post is.
- hashtags: 4-8 items, no # in the strings (the app adds #).
- Escape any double quotes inside strings.

User achievement: {achievement!r}
"""


def extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        raise ValueError("No JSON object found in model output")
    return json.loads(m.group(0))


@app.cls(
    image=image,
    gpu="A10G",
    timeout=60 * 10,
    scaledown_window=60 * 5,
    secrets=[modal.Secret.from_name("huggingface")],
)
class HypeItUp:
    @modal.enter()
    def load(self) -> None:
        import os

        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

        tok = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
        if not tok:
            raise RuntimeError("Set HF_TOKEN in Modal Secret 'huggingface'")

        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=tok)
        bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.float16)
        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            token=tok,
            quantization_config=bnb,
            device_map="auto",
        )
        self.model.eval()

    @modal.fastapi_endpoint(method="POST", docs=False)
    def generate(self, body: dict) -> dict[str, Any]:
        import torch

        achievement = str(body.get("achievement", "")).strip()
        if not achievement:
            return {"error": "achievement required"}

        drama = int(body.get("drama_level", 5))
        drama = max(1, min(10, drama))
        buzz = str(body.get("buzzword_density", "medium"))
        if buzz not in ("low", "medium", "max"):
            buzz = "medium"
        plen = str(body.get("post_length", "medium"))
        if plen not in ("short", "medium", "long"):
            plen = "medium"

        prompt = build_prompt(achievement, drama, buzz, plen)
        messages = [
            {"role": "system", "content": "You only output valid JSON objects."},
            {"role": "user", "content": prompt},
        ]

        device = next(self.model.parameters()).device
        input_ids = self.tokenizer.apply_chat_template(
            messages,
            add_generation_prompt=True,
            return_tensors="pt",
        ).to(device)

        max_new = {"short": 450, "medium": 700, "long": 1024}[plen]
        with torch.no_grad():
            out = self.model.generate(
                input_ids,
                max_new_tokens=max_new,
                do_sample=True,
                temperature=0.85,
                top_p=0.9,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        gen = out[0, input_ids.shape[-1] :]
        raw = self.tokenizer.decode(gen, skip_special_tokens=True)

        try:
            data = extract_json(raw)
        except Exception as e:
            return {
                "error": "model_output_parse_failed",
                "detail": str(e),
                "raw_preview": raw[:800],
            }

        required = ("hook", "body", "hashtags", "cringe_score", "share_title")
        if not all(k in data for k in required):
            return {"error": "invalid_json_shape", "got": list(data.keys())}

        if not isinstance(data["hashtags"], list):
            return {"error": "hashtags must be a list"}

        return {
            "hook": str(data["hook"]),
            "body": str(data["body"]),
            "hashtags": [str(x) for x in data["hashtags"]],
            "cringe_score": float(data["cringe_score"]),
            "share_title": str(data["share_title"]),
        }
