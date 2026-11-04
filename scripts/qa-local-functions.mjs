// HTTP adapter for exercising the exported web handlers without Vercel or provider access.
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import checkout from '../api/checkout-test.mjs';
import webhook from '../api/stripe-test-webhook.mjs';
for (const key of Object.keys(process.env)) if (key.startsWith('GUA_TEST_') || key === 'VERCEL_ENV') delete process.env[key];
const routes = { '/api/checkout-test': checkout, '/api/stripe-test-webhook': webhook };
const server = createServer(async (req, res) => {
  try {
    const endpoint = routes[req.url];
    if (!endpoint) { res.writeHead(404).end(); return; }
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://127.0.0.1${req.url}`, { method:req.method, headers:req.headers, ...(req.method === 'GET' ? {} : {body:Buffer.concat(chunks)}) });
    const result = await endpoint.fetch(request);
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(Buffer.from(await result.arrayBuffer()));
  } catch { res.writeHead(500).end(); }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {
  const base=`http://127.0.0.1:${server.address().port}`;
  const result=[];
  for(const path of Object.keys(routes)) for(const method of ['GET','POST']) {
    const response=await fetch(base+path,{method,...(method==='POST'?{body:'{}',headers:{'content-type':'application/json'}}:{})});
    assert.equal(response.status,method==='GET'?405:503);
    result.push({path,method,status:response.status});
  }
  console.log(JSON.stringify({result,scope:'Actual loopback HTTP and web handler exports, no configured providers; not Vercel runtime or external integration.'}));
} finally { await new Promise(resolve=>server.close(resolve)); }
