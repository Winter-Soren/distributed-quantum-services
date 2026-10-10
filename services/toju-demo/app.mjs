import express from 'express';
import multer from 'multer';
import { timingSafeEqual } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { decodePaymentSignatureHeader, encodePaymentRequiredHeader, encodePaymentResponseHeader } from '@x402/core/http';
import { NETWORK, USDC, MAX_BYTES, quote, validateArtifact, validateConfig } from './policy.mjs';

export function createApp({env,store,pin,facilitator}) {
  validateConfig(env);
  const origin=new URL(env.PUBLIC_BASE_URL || env.RENDER_EXTERNAL_URL);
  if(origin.protocol!=='https:' && !(origin.protocol==='http:' && ['localhost','127.0.0.1'].includes(origin.hostname))) throw Error('HTTPS service origin required.');
  const app=express();
  app.disable('x-powered-by');
  app.get('/health',(_req,res)=>res.json({status:'ok',network:NETWORK,service:'toju-agent-demo'}));
  app.use((req,res,next)=>{
    res.set('Cache-Control','no-store');
    const got=Buffer.from(req.get('Authorization')||'');const expected=Buffer.from(`Bearer ${env.TOJU_DEMO_ACCESS_TOKEN}`);
    if(got.length!==expected.length||!timingSafeEqual(got,expected))return res.status(401).json({error:'Authentication required.'});
    next();
  });
  app.get('/pricing/quote',(req,res)=>{
    try {res.json({quote:quote(Number(req.query.size),Number(req.query.duration)),network:NETWORK,asset:USDC,payTo:env.BASE_USDC_WALLET,maxBytes:MAX_BYTES});}
    catch(e){res.status(400).json({error:e.message});}
  });
  app.get('/exports/:id',async(req,res)=>{
    const row=await store.get(req.params.id);
    if(!row)return res.status(404).json({error:'Export not found.'});
    res.json(row);
  });
  const multipart=multer({storage:multer.memoryStorage(),limits:{fileSize:MAX_BYTES,files:1,fields:0,parts:2}}).single('file');
  app.post('/upload/agent',multipart,async(req,res)=>{
    let payment,requirements,resource,id;
    try {
      validateArtifact(req.file,req.query);
      id=req.query.id;
      if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))throw Error('A unique export ID is required.');
      requirements={scheme:'exact',network:NETWORK,asset:USDC,amount:quote(req.file.size,30).atomic,payTo:env.BASE_USDC_WALLET,maxTimeoutSeconds:120,extra:{name:'USDC',version:'2'}};
      resource={url:new URL(req.originalUrl,origin).href,description:'Public IPFS report storage for 30 days',mimeType:'application/json'};
      const header=req.get('PAYMENT-SIGNATURE');
      if(!header){const challenge={x402Version:2,resource,accepts:[requirements]};return res.status(402).set('PAYMENT-REQUIRED',encodePaymentRequiredHeader(challenge)).json(challenge);}
      if(header.length>16384)throw Error('Payment header too large.');
      payment=decodePaymentSignatureHeader(header);
      if(payment.x402Version!==2||!isDeepStrictEqual(payment.accepted,requirements)||payment.resource?.url!==resource.url)throw Error('Payment differs from the approved resource or testnet quote.');
      const auth=payment.payload?.authorization;
      if(!/^0x[0-9a-fA-F]{40}$/.test(auth?.from||'')||!/^0x[0-9a-fA-F]{64}$/.test(auth?.nonce||''))throw Error('EIP-3009 authorization required.');
    }catch(e){return res.status(400).json({error:e.message});}
    let verified;
    try {verified=await facilitator.verify(payment,requirements);}
    catch{return res.status(503).json({error:'Testnet payment verification unavailable. No upload started.'});}
    if(!verified.isValid)return res.status(402).json({error:'Testnet payment authorization rejected.'});
    const auth=payment.payload.authorization;
    const row={id,sha256:req.query.sha256,filename:req.file.originalname,bytes:req.file.size,network:NETWORK,amount:requirements.amount,status:'processing',payment_id:`${auth.from.toLowerCase()}:${auth.nonce.toLowerCase()}`,retained_until:new Date(Date.now()+30*86400000).toISOString()};
    if(!await store.claim(row))return res.status(409).json({error:'Export already attempted or demo quota exhausted. Check its receipt; do not pay again.',id});
    try {
      const cid=await pin(req.file,id);
      await store.update(id,{cid,status:'pinned'});
      const settlement=await facilitator.settle(payment,requirements);
      if(!settlement.success||settlement.network!==NETWORK||!/^0x[0-9a-fA-F]{64}$/.test(settlement.transaction||''))throw Error('Settlement not confirmed');
      const receipt={...row,cid,status:'stored',transaction:settlement.transaction,url:`https://ipfs.io/ipfs/${cid}/${encodeURIComponent(row.filename)}`};
      delete receipt.payment_id;
      await store.update(id,receipt);
      res.set('PAYMENT-RESPONSE',encodePaymentResponseHeader(settlement)).json(receipt);
    }catch{
      await store.update(id,{status:'uncertain'}).catch(()=>{});
      res.status(503).json({error:'Storage or settlement outcome is uncertain. Check the export receipt; do not submit another payment.',id});
    }
  });
  app.use((err,_req,res,_next)=>res.status(err instanceof multer.MulterError?400:503).json({error:err instanceof multer.MulterError?'Upload exceeds demo limits.':'Storage service unavailable.'}));
  return app;
}
