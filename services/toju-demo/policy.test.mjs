import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quote, validateConfig, validateArtifact, NETWORK, USDC } from './policy.mjs';

test('charges micro-USDC with a floor and consistent rounding', () => {
  assert.equal(quote(1, 30).atomic, '1');
  assert.equal(quote(250000, 30).atomic, '23');
  assert.equal(quote(250000, 30).usdc, '0.000023');
  assert.throws(() => quote(262145, 30));
  assert.throws(() => quote(3, 0));
  assert.throws(() => quote(3, 31));
});
test('refuses mainnet, missing authentication, and invalid recipients', () => {
  const config = { X402_NETWORK: 'sepolia', BASE_USDC_WALLET: '0x' + '1'.repeat(40), TOJU_DEMO_ACCESS_TOKEN: 'a'.repeat(48), DATABASE_URL: 'postgresql://localhost/demo', PINATA_JWT: 'test' };
  assert.doesNotThrow(() => validateConfig(config));
  assert.throws(() => validateConfig({...config, X402_NETWORK:'mainnet'}));
  assert.throws(() => validateConfig({...config, TOJU_DEMO_ACCESS_TOKEN:''}));
  assert.throws(() => validateConfig({...config, BASE_USDC_WALLET:'invalid'}));
  assert.equal(NETWORK, 'eip155:84532');
  assert.equal(USDC.toLowerCase(), '0x036cbd53842c5426634e7929541ec2318f3dcf7e');
});
test('binds paid artifact to exact size and SHA-256', () => {
  const file = { buffer: Buffer.from('abc'), size:3, originalname:'report.md', mimetype:'text/markdown' };
  const query = { size:'3', duration:'30', sha256:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' };
  assert.doesNotThrow(() => validateArtifact(file,query));
  assert.throws(() => validateArtifact(file,{...query,size:'2'}));
  assert.throws(() => validateArtifact(file,{...query,sha256:'0'.repeat(64)}));
  assert.throws(() => validateArtifact({...file, originalname:'../report.md'},query));
});
