const PRODUCTS = {
  hero_monthly:{title:'Hero · Mensual',price:99}, hero_perm:{title:'Hero · Permanente',price:249},
  titan_monthly:{title:'Titan · Mensual',price:149}, titan_perm:{title:'Titan · Permanente',price:349},
  divine_monthly:{title:'Divine · Mensual',price:199}, divine_perm:{title:'Divine · Permanente',price:449},
  legend_monthly:{title:'Legend · Mensual',price:249}, legend_perm:{title:'Legend · Permanente',price:599},
  arleymc_monthly:{title:'ArleyMC · Mensual',price:299}, arleymc_perm:{title:'ArleyMC · Permanente',price:799},
  supreme_monthly:{title:'Supreme · Mensual',price:399}, supreme_perm:{title:'Supreme · Permanente',price:999},
  marihuana:{title:'Marihuana',price:49}, cocaine:{title:'Cocaína',price:69}, alcohol:{title:'Alcohol',price:59},
  tabaco:{title:'Tabaco',price:39}, pentanilo:{title:'Pentanilo',price:99},
  marihuana_x5:{title:'Pack Marihuana x5',price:199}, cocaine_x5:{title:'Pack Cocaína x5',price:299},
  alcohol_x5:{title:'Pack Alcohol x5',price:249}, tabaco_x5:{title:'Pack Tabaco x5',price:169},
  pentanilo_x5:{title:'Pack Pentanilo x5',price:399}, drugs_pack:{title:'ArleyMC Drugs Pack',price:399}
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}

export async function onRequestPost({request,env}){
  if(!env.MP_ACCESS_TOKEN) return json({error:'Falta configurar MP_ACCESS_TOKEN en Cloudflare.'},500);
  let body;
  try{body=await request.json()}catch{return json({error:'Solicitud inválida.'},400)}
  const {product,nick,discord,email}=body||{};
  const p=PRODUCTS[product];
  if(!p) return json({error:'Producto no válido.'},400);
  if(typeof nick!=='string'||nick.trim().length<1||nick.trim().length>32) return json({error:'Nick de Minecraft inválido.'},400);
  if(typeof discord!=='string'||discord.trim().length<1||discord.trim().length>80) return json({error:'Usuario de Discord inválido.'},400);
  if(typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||email.trim().length>120) return json({error:'Correo electrónico inválido.'},400);

  const origin=new URL(request.url).origin;
  const ref='ARLEYMC-'+crypto.randomUUID();
  const description=`ArleyMC | ${p.title} | Nick: ${nick.trim()} | Discord: ${discord.trim()}`;
  const payload={
    type:'online', processing_mode:'manual', total_amount:p.price.toFixed(2), external_reference:ref,
    description,
    payer:{email:email.trim()},
    items:[{title:p.title,unit_price:p.price.toFixed(2),quantity:1,unit_measure:'unit',total_amount:p.price.toFixed(2)}],
    config:{online:{success_url:`${origin}/?payment=success&ref=${encodeURIComponent(ref)}`,failure_url:`${origin}/?payment=failure&ref=${encodeURIComponent(ref)}`,pending_url:`${origin}/?payment=pending&ref=${encodeURIComponent(ref)}`,auto_return:'all'}}
  };
  const response=await fetch('https://api.mercadopago.com/v1/orders',{method:'POST',headers:{'Authorization':`Bearer ${env.MP_ACCESS_TOKEN}`,'Content-Type':'application/json','Accept':'application/json','X-Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(payload)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) return json({error:'Mercado Pago rechazó la creación del pago.',detail:data?.message||data?.error||null},502);
  return json({checkout_url:data.checkout_url,order_id:data.id,reference:ref});
}
