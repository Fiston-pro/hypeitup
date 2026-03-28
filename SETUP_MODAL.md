# Modal + Llama for HypeItUp

This guide walks you from zero to a **deployed HTTPS endpoint** that runs an **instruct LLM (Llama 3.2 3B by default)** on Modal and returns the **strict JSON** your Next.js app expects.

## What you get

- **GPU inference** on Modal (`A10G` in the example — adjust if you want).
- **4-bit quantized** weights so a 3B model fits comfortably.
- **POST JSON in → JSON out**, matching `MODAL_API_URL` in HypeItUp.

## 1. Prerequisites

1. **Modal account** — [modal.com](https://modal.com)
2. **Install the CLI** (in your own machine’s terminal):

   ```bash
   pip install modal
   ```

3. **Log in**:

   ```bash
   modal token new
   ```

   Follow the browser flow and paste the token when asked.

## 2. Hugging Face access (Llama is gated)

The example uses **`meta-llama/Llama-3.2-3B-Instruct`**.

1. Create a [Hugging Face](https://huggingface.co) account.
2. Open the [model page](https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct), accept Meta’s license, and request access if required.
3. Create a **read token**: Settings → Access Tokens → New (read permission is enough).

**Alternative (no gating):** In `modal/hypeitup_llama.py`, comment out the Llama `MODEL_ID` and uncomment:

```python
MODEL_ID = "Qwen/Qwen2.5-3B-Instruct"
```

Then you do not need Llama approval (still use `HF_TOKEN` to avoid rate limits).

## 3. Store the token in Modal (Secret)

Modal Secrets keep credentials out of your repo.

1. Dashboard → **Secrets** → **Create**.
2. Name: **`huggingface`** (must match the script).
3. Add one environment variable:

   - **`HF_TOKEN`** = your Hugging Face read token.

Save. The script reads `HF_TOKEN` inside the container.

## 4. Deploy the app

From your **project root** (where this repo lives):

```bash
modal deploy modal/hypeitup_llama.py
```

The first run **builds a large image** (PyTorch + CUDA + transformers) and can take several minutes.

When it finishes, Modal prints one or more **HTTPS URLs**. Look for the endpoint that corresponds to the class method **`generate`** (often the path contains `generate` or the class name `HypeItUp`).

### Copy the exact POST URL

- It must accept **POST** with **JSON body** (same shape as in `SETUP.md`).
- Paste that full URL into **`.env.local`** / Vercel as:

  ```env
  MODAL_API_URL=https://YOUR-WORKSPACE--hypeitup-generate-...modal.run
  ```

**Tip:** If you are unsure which URL is correct, run with docs enabled temporarily: in `hypeitup_llama.py`, change `docs=False` to `docs=True` on `@modal.fastapi_endpoint`, redeploy, open `.../docs` in the browser, and confirm the POST path.

## 5. Test with curl

Replace `YOUR_URL` with your deployed URL:

```bash
curl -X POST "YOUR_URL" ^
  -H "Content-Type: application/json" ^
  -d "{\"achievement\":\"I replied to all my emails\",\"drama_level\":7,\"buzzword_density\":\"max\",\"post_length\":\"medium\"}"
```

On macOS/Linux use `\` line continuations instead of `^`.

You should get JSON with `hook`, `body`, `hashtags`, `cringe_score`, `share_title`.

## 6. Connect HypeItUp

1. Set **`MODAL_API_URL`** to that same URL in your Next.js env.
2. Restart `npm run dev` or redeploy Vercel.

No change is required in the Next.js code if Modal returns the expected JSON shape.

## 7. Local ephemeral testing (`modal serve`)

```bash
modal serve modal/hypeitup_llama.py
```

This gives a **temporary** URL (good for iteration). It goes away when you stop the process. Use **`modal deploy`** for production.

## 8. Costs and knobs

- **GPU type:** In `hypeitup_llama.py`, change `gpu="A10G"` to another [Modal GPU](https://modal.com/docs/guide/gpu) if you need more VRAM or speed.
- **Model size:** Smaller models cold-start faster and cost less; larger models write richer posts but need bigger GPUs.
- **Cold starts:** First request after idle may take longer while the container loads the model.

## 9. Troubleshooting

| Symptom | What to check |
|--------|----------------|
| `401` / HF errors | `HF_TOKEN` in Secret `huggingface`; Llama license accepted on HF |
| CUDA / bitsandbytes errors | GPU image + `bitsandbytes` versions; try upgrading `bitsandbytes` in the image |
| Invalid JSON from model | Lower `temperature` or tighten the prompt in `build_prompt`; check `raw_preview` in error responses |
| Wrong URL in Next.js | Use the **exact** URL from `modal deploy` output for the **POST** endpoint |

## 10. Optional: secure the endpoint

Your Next.js server calls Modal with a **secret URL** (`MODAL_API_URL`). Do not expose that URL in client-side code (HypeItUp already calls Modal **only from the server**).

For extra protection, Modal supports **proxy auth** (`Modal-Key` / `Modal-Secret` headers) or your own Bearer token inside the FastAPI handler — add that only if you need it; you would then add the same header from `app/api/generate/route.ts` when calling `fetch`.

---

Official references:

- [Web endpoints](https://modal.com/docs/guide/webhooks) (`@modal.fastapi_endpoint`)
- [GPU](https://modal.com/docs/guide/gpu)
- [Secrets](https://modal.com/docs/guide/secrets)
- [vLLM example](https://modal.com/docs/examples/vllm_inference) (for larger production setups)
