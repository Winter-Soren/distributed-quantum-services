# Toju agent demo profile

Small, separately hosted **adaptation** of the Toju agent storage workflow, based on
[Toju/afara](https://github.com/tojunetwork/afara) at
`a0053d5fdd81904e00d1f6ac5889af31a8153d9d` and its Apache-2.0 licensed x402 SDK.
This is not the complete upstream Toju server or an official Toju deployment.
It preserves the quote → x402 payment → Pinata directory upload workflow, with
explicit approval handled by QuantumNodes. The client adapter adds authentication,
a proposal ID and a SHA-256 binding instead of the SDK's automatic payment retry.

Only **Base Sepolia / USDC / chain 84532** is accepted. Solana and Filecoin routes
are not mounted. The API signs no wallet transactions and needs no private key.

## Run

Use Node 22, install the pinned dependencies with `npm ci`, copy `.env.example` to
`.env`, fill the values, then `npm start`. Run `npm test` for boundary tests.
On Render: public repository, Node, root `services/toju-demo`, build
`npm ci --omit=dev`, start `npm start`, health `/health`, instance **Free**.
`RENDER_EXTERNAL_URL` supplies the public origin; omit `PUBLIC_BASE_URL` on Render.
Use a dedicated Neon Free database; startup creates two small demo tables.

All API routes except `/health` require `Authorization: Bearer <TOJU_DEMO_ACCESS_TOKEN>`.
Use a randomly generated token of at least 32 characters, server-side only.
The fixed recording quota is **20 attempted uploads total**, each at most
**256 KiB**, retained at least **30 days**. Quota survives restarts. Health checks
do not query Neon. Keep Neon at 0.25 CU with 5-minute scale-to-zero.

## Guarantees and limits

- Exact bytes, filename, SHA-256, recipient, token, network and price are checked.
- The quote uses integer rounding up to a micro-USDC. No zero-price bypass.
- Neon claims an export and payment nonce before pinning. Duplicates cannot pin
  or settle again. A timed-out request must be reconciled with `GET /exports/:id`;
  it must never be automatically paid again.
- Actual Pinata CID and actual facilitator transaction hash are returned. `stored`
  means pin and settlement confirmed; the client must also retrieve/hash bytes.
- Data on public IPFS is public. Approval must disclose this and show the artifact.
- The demo keeps pins past their minimum retention date. No scheduled unpinning
  or deletion guarantee is implemented. Upgrade lifecycle handling before offering
  a paid storage service. Free host sleep and third-party limits can interrupt demos.
- Never commit `.env`, database URLs, tokens, API keys or wallet secrets.
