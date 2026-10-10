import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createApp } from './app.mjs';
import { decodePaymentRequiredHeader, encodePaymentSignatureHeader } from '@x402/core/http';

const env = {X402_NETWORK:'sepolia',BASE_USDC_WALLET:'0x1111111111111111111111111111111111111111',TOJU_DEMO_ACCESS_TOKEN:'x'.repeat(32),DATABASE_URL:'test',PINATA_JWT:'test',PUBLIC_BASE_URL:'http://127.0.0.1'};
async function fixture(t, settlementError=false) {
 const rows=new Map(); let pins=0,settles=0,reads=0;
 const store={get:async id=>{reads++;return rows.get(id)},claim:async row=>{if(rows.has(row.id))return false;rows.set(row.id,row);return true},update:async(id,patch)=>Object.assign(rows.get(id),patch)};
 const facilitator={verify:async()=>({isValid:true}),settle:async()=>{settles++;if(settlementError)throw Error('timeout');return {success:true,network:'eip155:84532',transaction:'0x'+'a'.repeat(64)}}};
 const app=createApp({env,store,facilitator,pin:async()=>{pins++;return 'bafytest'}});
 const server=app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r));
 t.after(()=>new Promise(r=>server.close(r))); const base=`http://127.0.0.1:${server.address().port}`;
 const bytes='A demo report'; const hash=createHash('sha256').update(bytes).digest('hex');
 const path=`/upload/agent?size=${bytes.length}&duration=30&sha256=${hash}&id=5aa48c91-2f27-4638-83f8-0f9df92c1911`;
 async function upload(payload,content=bytes) {const body=new FormData();body.set('file',new Blob([content],{type:'text/markdown'}),'report.md');return fetch(base+path,{method:'POST',headers:{Authorization:`Bearer ${env.TOJU_DEMO_ACCESS_TOKEN}`,...(payload?{'PAYMENT-SIGNATURE':encodePaymentSignatureHeader(payload)}:{})},body});}
 return {base,upload,rows,counts:()=>({pins,settles,reads})};
}
function payload(challenge) {return {x402Version:2,resource:challenge.resource,accepted:challenge.accepts[0],payload:{signature:'0x'+'b'.repeat(130),authorization:{from:'0x'+'2'.repeat(40),nonce:'0x'+'c'.repeat(64)}}};}
test('health never wakes Neon; authenticated quote and upload fail closed',async t=>{
 const f=await fixture(t);assert.equal((await fetch(f.base+'/health')).status,200);assert.equal(f.counts().reads,0);
 assert.equal((await fetch(f.base+'/pricing/quote?size=5&duration=30')).status,401);
 const r=await f.upload();assert.equal(r.status,402);const c=decodePaymentRequiredHeader(r.headers.get('payment-required'));
 assert.equal(c.accepts[0].network,'eip155:84532');assert.equal(c.accepts[0].amount,'1');assert.equal(f.counts().pins,0);
 assert.equal((await f.upload(null,'changed')).status,400);
 const p=payload(c);p.accepted.network='eip155:8453';assert.equal((await f.upload(p)).status,400);assert.equal(f.counts().settles,0);
});
test('one claim produces one real receipt; duplicate requests never pin or settle again',async t=>{
 const f=await fixture(t);const c=decodePaymentRequiredHeader((await f.upload()).headers.get('payment-required'));const p=payload(c);
 const results=await Promise.all([f.upload(p),f.upload(p)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const receipt=await results.find(r=>r.status===200).json();assert.equal(receipt.cid,'bafytest');assert.equal(receipt.status,'stored');assert.match(receipt.transaction,/^0xa{64}$/);
 assert.deepEqual(f.counts(),{pins:1,settles:1,reads:0});
});
test('uncertain settlement is persisted and cannot be automatically repaid',async t=>{
 const f=await fixture(t,true);const c=decodePaymentRequiredHeader((await f.upload()).headers.get('payment-required'));const p=payload(c);
 assert.equal((await f.upload(p)).status,503);assert.equal([...f.rows.values()][0].status,'uncertain');
 assert.equal((await f.upload(p)).status,409);assert.equal(f.counts().settles,1);
});
