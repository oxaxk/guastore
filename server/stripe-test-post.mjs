const MAX_BYTES=262144;
// A failed or timed-out POST can have succeeded remotely: caller must preserve reservation.
export async function postTestSession({secretKey,body,idempotencyKey,fetchImpl=fetch,timeoutMs=5000}) {
  if (!/^(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+$/.test(secretKey||'') || !/^gua-checkout-[A-Za-z0-9_-]{1,100}$/.test(idempotencyKey||'') || typeof fetchImpl!=='function' || !Number.isSafeInteger(timeoutMs) || timeoutMs<1 || timeoutMs>10000) throw Error('TEST_POST_NOT_CONFIGURED');
  const controller=new AbortController();let timer;
  try {return await Promise.race([
    (async()=>{
      const response=await fetchImpl('https://api.stripe.com/v1/checkout/sessions',{method:'POST',redirect:'error',headers:{Authorization:`Bearer ${secretKey}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':idempotencyKey,'Stripe-Version':'2026-09-30.endive'},body,signal:controller.signal});
      if(!response.ok)throw Error('FAILED');const len=response.headers.get('content-length');
      if(len&&(!/^\d+$/.test(len)||Number(len)>MAX_BYTES)||!response.body)throw Error('FAILED');
      const reader=response.body.getReader();let size=0;const chunks=[];
      try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw Error('FAILED');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
      let data;try{data=JSON.parse(Buffer.concat(chunks,size).toString('utf8'));}catch{throw Error('FAILED');}
      if(!data||typeof data!=='object'||Array.isArray(data))throw Error('FAILED');return data;
    })(),
    new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('STRIPE_POST_TIMEOUT'));},timeoutMs);}),
  ]);}catch(error){if(error?.message==='STRIPE_POST_TIMEOUT')throw error;throw Error('STRIPE_POST_FAILED');}
  finally{clearTimeout(timer);controller.abort();}
}
