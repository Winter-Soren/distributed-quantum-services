import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChallenge, validateTypedData } from './client.mjs';
import { NETWORK, USDC } from './policy.mjs';
const approved={amount:'1',payTo:'0x'+'1'.repeat(40),url:'https://example.test/upload/agent?sha256=abc',address:'0x'+'2'.repeat(40)};
const required=()=>({x402Version:2,resource:{url:approved.url},accepts:[{scheme:'exact',network:NETWORK,asset:USDC,amount:'1',payTo:approved.payTo,maxTimeoutSeconds:120,extra:{name:'USDC',version:'2'}}]});
test('rejects malicious challenges before any signature',()=>{
 assert.doesNotThrow(()=>validateChallenge(required(),approved));
 for(const [key,value] of [['network','eip155:8453'],['asset','0x'+'3'.repeat(40)],['payTo','0x'+'4'.repeat(40)],['amount','2'],['amount','-1'],['maxTimeoutSeconds',9999]]) {const r=required();r.accepts[0][key]=value;assert.throws(()=>validateChallenge(r,approved));}
 const r=required();r.resource.url='https://attacker.test/';assert.throws(()=>validateChallenge(r,approved));
});
test('validates typed payment and denies arbitrary contract signatures',()=>{
 const data={domain:{name:'USDC',version:'2',chainId:84532,verifyingContract:USDC},primaryType:'TransferWithAuthorization',message:{from:approved.address,to:approved.payTo,value:'1',validAfter:'0',validBefore:String(Math.floor(Date.now()/1000)+120),nonce:'0x'+'a'.repeat(64)}};
 assert.doesNotThrow(()=>validateTypedData(data,approved));
 assert.throws(()=>validateTypedData({...data,primaryType:'Permit'},approved));
 assert.throws(()=>validateTypedData({...data,message:{...data.message,to:'0x'+'3'.repeat(40)}},approved));
 assert.throws(()=>validateTypedData({...data,domain:{...data.domain,chainId:8453}},approved));
});
