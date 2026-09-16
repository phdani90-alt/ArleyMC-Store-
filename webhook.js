function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function hmac(secret,message){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(message)))}
function timingSafe(a,b){if(!a||!b||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
function parseSig(v){const out={};for(const part of (v||'').split(',')){const [k,val]=part.split('=',2);if(k&&val)out[k.trim()]=val.trim()}return out}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}})}

export async function onRequestPost({request,env}){
  if(!env.MP_ACCESS_TOKEN) return json({error:'Missing MP_ACCESS_TOKEN'},500);
  const url=new URL(request.url);
  const dataId=url.searchParams.get('data.id')||'';
  const signature=request.headers.get('x-signature')||'';
  const requestId=request.headers.get('x-request-id')||'';
  if(env.MP_WEBHOOK_SECRET){
    const parts=parseSig(signature);
    if(!parts.ts||!parts.v1) return json({error:'Invalid signature'},401);
    const manifest=`id:${dataId};request-id:${requestId};ts:${parts.ts};`;
    const expected=await hmac(env.MP_WEBHOOK_SECRET,manifest);
    if(!timingSafe(expected,parts.v1)) return json({error:'Invalid signature'},401);
  }
  const body=await request.json().catch(()=>({}));
  if((body.type||url.searchParams.get('type'))!=='order') return json({received:true});
  if(!dataId) return json({received:true});

  const mp=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(dataId)}`,{headers:{'Authorization':`Bearer ${env.MP_ACCESS_TOKEN}`,'Accept':'application/json'}});
  const order=await mp.json().catch(()=>({}));
  if(!mp.ok) return json({error:'Could not retrieve order'},502);

  const payment=order?.transactions?.payments?.[0]||{};
  const status=order.status||payment.status||'unknown';
  const message={content:'',allowed_mentions:{parse:[]}};
  message.content=[
    '🛒 **Nueva actualización de compra — ArleyMC**',
    `**Producto:** ${order.items?.[0]?.title||'No disponible'}`,
    `**Monto:** $${order.total_amount||'0'} MXN`,
    `**Estado:** ${status}`,
    `**Referencia:** ${order.external_reference||'N/D'}`,
    `**Order ID:** ${order.id||dataId}`,
    `**Descripción:** ${order.description||'N/D'}`,
    status==='processed' || status==='approved' ? '⚠️ **No entregar todavía. Revisar el pago manualmente antes de otorgar el producto.**' : 'ℹ️ El pago todavía no está aprobado; revisar cuando cambie el estado.'
  ].join('\n');
  if(env.DISCORD_WEBHOOK_URL){
    await fetch(env.DISCORD_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(message)}).catch(()=>{});
  }
  return json({received:true});
}
