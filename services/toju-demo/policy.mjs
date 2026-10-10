import { createHash } from 'node:crypto';

export const NETWORK = 'eip155:84532';
export const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
export const MAX_BYTES = 262144;

export function quote(size, days) {
  if (!Number.isSafeInteger(size) || size < 1 || size > MAX_BYTES || days !== 30)
    throw new Error('Demo exports must be 1–262144 bytes and retained for 30 days.');
  // 3e-12 USD/byte/day, rounded up to USDC atomic units without floats.
  const atomic = (BigInt(size) * BigInt(days) * 3n + 999999n) / 1000000n;
  const usdc = `0.${atomic.toString().padStart(6, '0')}`;
  return { atomic: atomic.toString(), usdc, totalCost: Number(usdc), effectiveDuration:30 };
}

export function validateConfig(env) {
  if (env.X402_NETWORK !== 'sepolia') throw new Error('Only Base Sepolia is allowed.');
  if (!/^0x[0-9a-fA-F]{40}$/.test(env.BASE_USDC_WALLET || '') || /^0x0{40}$/.test(env.BASE_USDC_WALLET))
    throw new Error('A testnet payment recipient is required.');
  if ((env.TOJU_DEMO_ACCESS_TOKEN || '').length < 32) throw new Error('Demo access token is required.');
  for (const key of ['DATABASE_URL','PINATA_JWT']) if (!env[key]) throw new Error(`${key} is required.`);
}

export function validateArtifact(file, query) {
  quote(Number(query.size),Number(query.duration));
  if (!file || file.size !== Number(query.size)) throw new Error('File size differs from the approved quote.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/.test(file.originalname)) throw new Error('Invalid filename.');
  if (!['text/markdown','text/plain','application/json'].includes(file.mimetype)) throw new Error('Only report or JSON exports are supported.');
  if (!/^[0-9a-f]{64}$/.test(query.sha256 || '') || createHash('sha256').update(file.buffer).digest('hex') !== query.sha256)
    throw new Error('Artifact differs from its approved SHA-256.');
}
