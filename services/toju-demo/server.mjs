import { neon } from '@neondatabase/serverless';
import { PinataSDK } from 'pinata';
import { HTTPFacilitatorClient } from '@x402/core/http';
import { createApp } from './app.mjs';
import { validateConfig } from './policy.mjs';

validateConfig(process.env);
const sql=neon(process.env.DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS demo_exports (id uuid PRIMARY KEY, payment_id text UNIQUE NOT NULL, receipt jsonb NOT NULL)`;
await sql`CREATE TABLE IF NOT EXISTS demo_quota (id integer PRIMARY KEY CHECK (id=1), used integer NOT NULL DEFAULT 0)`;
await sql`INSERT INTO demo_quota(id) VALUES(1) ON CONFLICT DO NOTHING`;
const store={
  async get(id){const rows=await sql`SELECT receipt FROM demo_exports WHERE id=${id}`;return rows[0]?.receipt;},
  async claim(row){
    // Lock the single quota row before claiming; duplicate attempts never consume a second pin.
    const rows=await sql`WITH capacity AS (UPDATE demo_quota SET used=used+1 WHERE id=1 AND used<20 AND NOT EXISTS(SELECT 1 FROM demo_exports WHERE id=${row.id} OR payment_id=${row.payment_id}) RETURNING id), inserted AS (INSERT INTO demo_exports(id,payment_id,receipt) SELECT ${row.id},${row.payment_id},${JSON.stringify(row)}::jsonb FROM capacity ON CONFLICT DO NOTHING RETURNING id) SELECT id FROM inserted`;
    return rows.length===1;
  },
  async update(id,patch){await sql`UPDATE demo_exports SET receipt=receipt || ${JSON.stringify(patch)}::jsonb WHERE id=${id}`;}
};
const pinata=new PinataSDK({pinataJwt:process.env.PINATA_JWT});
const pin=async(file,id)=>{
  const result=await pinata.upload.public.fileArray([new File([file.buffer],file.originalname,{type:file.mimetype})]).name(`toju-demo-${id}`);
  if(!result.cid||!/^[a-zA-Z0-9]+$/.test(result.cid))throw Error('Pinata did not return a CID');
  return result.cid;
};
const facilitator=new HTTPFacilitatorClient({url:'https://x402.org/facilitator'});
const app=createApp({env:process.env,store,pin,facilitator});
app.listen(Number(process.env.PORT||8090),'0.0.0.0',()=>console.log('Toju demo API listening; Base Sepolia only.'));
