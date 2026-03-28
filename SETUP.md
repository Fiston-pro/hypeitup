# HypeItUp setup

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill values. On Vercel, add the same variables in **Project → Settings → Environment Variables**.

- **`MODAL_API_URL`** — Your Modal HTTPS endpoint (see §3). In **development**, if this is unset, the app uses a **mock** response so you can build UI without Modal.
- **`FIREBASE_*`** — Service account for **Admin SDK only** (kept on the server). Never put the private key in client code or public repos.
- **`IP_HASH_SALT`** — Long random string (e.g. `openssl rand -hex 32`). Used to hash IPs before storing; raw IPs are not stored.
- **`ADMIN_PASSWORD`** — Password for `/admin`.
- **`ADMIN_SESSION_SECRET`** — Long random secret used to sign the **httpOnly** admin cookie (HMAC-SHA256). Different from `ADMIN_PASSWORD`.

### Vercel note on rate limiting

There isn’t a separate unlimited free “rate limit product” you must use. **Daily limits are enforced in Firestore** (5 generations per anonymous `session_id` per UTC day), which is free within normal quotas and works the same on Vercel or any host.

---

## 2. Firebase (Firestore + safe setup)

1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore** (production mode is fine; we lock rules down).
3. **Rules:** paste `firestore.rules` from this repo (deny all client access). Deploy rules:  
   `firebase deploy --only firestore:rules`  
   (or paste in the Console → Firestore → Rules.)
4. **Service account:** Project settings → Service accounts → Generate new private key → JSON file.
   - `FIREBASE_PROJECT_ID` → `project_id`
   - `FIREBASE_CLIENT_EMAIL` → `client_email`
   - `FIREBASE_PRIVATE_KEY` → `private_key` (keep quotes in `.env.local`; on Vercel paste the full key with `\n` for newlines if needed).

**Security**

- Only your **server** uses this key (Next.js API routes). Do not use client-side Firebase config for Firestore writes in this app.
- Restrict who can deploy env vars on Vercel; rotate keys if leaked.

**Collections used**

- `generations` — one document per generation (logs).
- `rate_limits` — daily counters per session (`{sessionId}_{YYYY-MM-DD}`).

Firestore may prompt you to create a **composite index** if a query fails; open the link from the error in the console to auto-create it.

---

## 3. Modal.com (AI endpoint)

**Full walkthrough (install Modal CLI, HF token, deploy Llama, get URL):** see **[SETUP_MODAL.md](./SETUP_MODAL.md)** and the included app **`modal/hypeitup_llama.py`**.

Your web endpoint must:

- **Method:** `POST`
- **Content-Type:** `application/json`
- **Body (from HypeItUp):**

```json
{
  "achievement": "string",
  "drama_level": 1,
  "buzzword_density": "low | medium | max",
  "post_length": "short | medium | long"
}
```

- **Response:** strict JSON (no markdown fences):

```json
{
  "hook": "string",
  "body": "string",
  "hashtags": ["string"],
  "cringe_score": 0,
  "share_title": "string"
}
```

Modal’s decorator is **`@modal.fastapi_endpoint`** (older docs may say `@modal.web_endpoint`).

Deploy with `modal deploy modal/hypeitup_llama.py`, then copy the printed **HTTPS** URL into **`MODAL_API_URL`**.

---

## 4. Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local — for local dev you can leave MODAL_API_URL empty to use the mock generator
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin: [http://localhost:3000/admin](http://localhost:3000/admin).

---

## 5. Deploy on Vercel

1. Push the repo to GitHub and import in Vercel.
2. Set all env vars (especially `FIREBASE_PRIVATE_KEY` formatting).
3. Deploy. Production uses real Modal when `MODAL_API_URL` is set.

**Contact for “Request more access”:** `byiringiroetienne2@gmail.com` (mailto link in the app).
