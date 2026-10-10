import { createHash } from 'node:crypto';
import { x402Client } from '@x402/core/client';
import { decodePaymentRequiredHeader, decodePaymentResponseHeader, encodePaymentSignatureHeader } from '@x402/core/http';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { NETWORK, USDC, MAX_BYTES } from './policy.mjs';

const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
export function validateChallenge(required,approved) {
  const r=required.accepts?.[0];
  if(required.x402Version!==2||required.resource?.url!==approved.url||required.accepts?.length!==1||r.scheme!=='exact'||r.network!==NETWORK||!same(r.asset,USDC)||!same(r.payTo,approved.payTo)||r.amount!==approved.amount||!/^\d+$/.test(r.amount)||BigInt(r.amount)<1n||BigInt(r.amount)>24n||!Number.isInteger(r.maxTimeoutSeconds)||r.maxTimeoutSeconds<1||r.maxTimeoutSeconds>120||r.extra?.name!=='USDC'||r.extra?.version!=='2')throw Error('Testnet payment challenge differs from approval.');
}
export function validateTypedData(data,approved) {
 const d=data.domain,m=data.message,now=Math.floor(Date.now()/1000);
 if(d?.name!=='USDC'||d.version!=='2'||Number(d.chainId)!==84532||!same(d.verifyingContract,USDC)||data.primaryType!=='TransferWithAuthorization'||!same(m?.from,approved.address)||!same(m?.to,approved.payTo)||String(m?.value)!==approved.amount||!/^0x[0-9a-fA-F]{64}$/.test(m?.nonce||'')||!Number.isSafeInteger(Number(m?.validAfter))||Number(m.validAfter)>now||Number(m.validAfter)<0||!Number.isSafeInteger(Number(m?.validBefore))||Number(m.validBefore)<=now||Number(m.validBefore)>now+180)throw Error('Refusing an unapproved typed-data signature.');
}
export async function uploadApproved(input,signTypedData) {
 const bytes=Buffer.from(input.content,'utf8');
 if(bytes.length<1||bytes.length>MAX_BYTES||createHash('sha256').update(bytes).digest('hex')!==input.sha256)throw Error('Approved artifact changed.');
 const endpoint=new URL(input.endpoint);
 if(endpoint.protocol!=='https:'&&!(endpoint.protocol==='http:'&&['localhost','127.0.0.1'].includes(endpoint.hostname)))throw Error('HTTPS endpoint required.');
 const url=new URL('/upload/agent',endpoint);
 url.search=new URLSearchParams({size:String(bytes.length),duration:'30',sha256:input.sha256,id:input.id}).toString();
 const approved={...input,url:url.href};
 const headers={Authorization:`Bearer ${process.env.TOJU_DEMO_ACCESS_TOKEN}`};
 const form=()=>{const f=new FormData();f.set('file',new Blob([bytes],{type:input.mime}),input.filename);return f;};
 const response=await fetch(url,{method:'POST',body:form(),headers,redirect:'error',signal:AbortSignal.timeout(60000)});
 if(response.status!==402)throw Error(`Storage challenge unavailable (HTTP ${response.status}).`);
 const required=decodePaymentRequiredHeader(response.headers.get('PAYMENT-REQUIRED')||'');
 validateChallenge(required,approved);
 const client=new x402Client().register(NETWORK,new ExactEvmScheme({address:input.address,signTypedData:async data=>{validateTypedData(data,approved);return signTypedData(data);}}));
 const payment=await client.createPaymentPayload(required);
 // A signed request is sent once. An uncertain response requires receipt reconciliation.
 const result=await fetch(url,{method:'POST',body:form(),headers:{...headers,'PAYMENT-SIGNATURE':encodePaymentSignatureHeader(payment)},redirect:'error',signal:AbortSignal.timeout(90000)});
 if(!result.ok)throw Error(`Storage outcome requires receipt verification (HTTP ${result.status}). Do not pay again.`);
 const receipt=await result.json();
 const settlement=decodePaymentResponseHeader(result.headers.get('PAYMENT-RESPONSE')||'');
 if(!settlement.success||settlement.network!==NETWORK||settlement.transaction!==receipt.transaction||receipt.status!=='stored'||receipt.sha256!==input.sha256||receipt.id!==input.id||!/^[a-zA-Z0-9]+$/.test(receipt.cid||''))throw Error('Storage receipt is not verified.');
 const saved=await fetch(`https://ipfs.io/ipfs/${receipt.cid}/${encodeURIComponent(input.filename)}`,{redirect:'error',signal:AbortSignal.timeout(60000)});
 if(!saved.ok||!saved.body)throw Error('Payment succeeded but public retrieval is not yet verified. Check receipt.');
 const chunks=[];let size=0;
 for await(const chunk of saved.body){size+=chunk.length;if(size>MAX_BYTES)throw Error('Retrieved content exceeds approved size.');chunks.push(chunk);}
 if(createHash('sha256').update(Buffer.concat(chunks)).digest('hex')!==input.sha256)throw Error('Public content hash does not match approval.');
 return {...receipt,verified:true};
}
