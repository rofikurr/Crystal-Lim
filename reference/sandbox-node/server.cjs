/* Sandbox integration only. Secrets are read on the server, never served. Node 20+. */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const catalog = require('./product-data.js');

function fail(message, status=400) { throw Object.assign(new Error(message), {status}); }
function createService({env=process.env, request=fetch, now=Date.now}={}) {
  const quotes=new Map(), sessions=new Map();
  function canonical(items) {
    if(!Array.isArray(items)||!items.length||items.length>60) fail('Keranjang tidak valid.');
    const counts=new Map();
    for(const item of items) {
      if(!catalog.some(p=>p.id===item.id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10) fail('Produk atau jumlah tidak valid.');
      counts.set(item.id,(counts.get(item.id)||0)+item.quantity);
    }
    return [...counts].sort(([a],[b])=>a.localeCompare(b)).map(([id,quantity])=>{
      if(quantity>10)fail('Maksimal 10 buah per produk.');
      return {id,quantity};
    });
  }
  function parcelItems(items) {
    let packages;
    try {packages=JSON.parse(env.SHIPPING_PACKAGES_JSON||'{}');}catch{fail('Konfigurasi paket belum valid.',503);}
    return items.map(item=>{
      const product=catalog.find(p=>p.id===item.id), parcel=packages[item.id];
      if(!parcel||!['weight','length','width','height'].every(k=>Number.isFinite(parcel[k])&&parcel[k]>0)) fail('Berat dan ukuran paket produk belum dikonfirmasi oleh toko.',503);
      return {name:product.name,value:product.price,quantity:item.quantity,weight:parcel.weight,length:parcel.length,width:parcel.width,height:parcel.height};
    });
  }
  async function getRates(postal,items) {
    if(!/^\d{5}$/.test(String(postal))) fail('Kode pos harus terdiri dari 5 digit.');
    if(!env.BITESHIP_API_KEY||!/^\d{5}$/.test(env.ORIGIN_POSTAL_CODE||'')) fail('API ongkir belum aktif. Toko perlu mengisi Biteship API key dan kode pos asal.',503);
    const response=await request('https://api.biteship.com/v1/rates/couriers',{
      method:'POST',headers:{Authorization:env.BITESHIP_API_KEY,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),
      body:JSON.stringify({origin_postal_code:Number(env.ORIGIN_POSTAL_CODE),destination_postal_code:Number(postal),couriers:env.BITESHIP_COURIERS||'jne,sicepat,anteraja',items:parcelItems(items)})
    });
    if(!response.ok)fail('API ongkir belum dapat memberikan tarif. Cek konfigurasi atau coba lagi.',502);
    const data=await response.json();
    if(data.success!==true||!Array.isArray(data.pricing))fail('Respons API ongkir tidak valid.',502);
    return data.pricing.filter(r=>Number.isSafeInteger(r.price)&&r.price>=0&&r.courier_code&&r.courier_service_code).map(r=>({
      id:`${r.courier_code}:${r.courier_service_code}`,name:`${r.courier_name} · ${r.courier_service_name}`,duration:r.duration||'',price:r.price
    }));
  }
  function prune() {
    for(const [id,q] of quotes)if(now()>q.expires){quotes.delete(id);for(const key of sessions.keys())if(key.startsWith(id+':'))sessions.delete(key);}
    if(quotes.size>=1000)fail('Layanan sedang sibuk, coba beberapa saat lagi.',429);
  }
  async function quote(body) {
    prune();const items=canonical(body.items),postal=String(body.postal),rates=await getRates(postal,items);
    const id=randomUUID(),expires=now()+600000;
    quotes.set(id,{items,postal,rates,expires});return {id,rates,expires};
  }
  function customer(raw) {
    if(!raw||typeof raw!=='object')fail('Alamat penerima wajib diisi.');
    const value={};
    for(const [name,max] of Object.entries({name:80,phone:20,email:120,province:80,city:80,district:80,village:80,address:400,postal:5})) {
      if(typeof raw[name]!=='string'||!raw[name].trim()||raw[name].length>max)fail('Lengkapi data penerima dengan benar.');
      value[name]=raw[name].trim();
    }
    if(!/^[+0-9 ()-]{9,20}$/.test(value.phone)||!/^\S+@\S+\.\S+$/.test(value.email)||!/^\d{5}$/.test(value.postal))fail('Email, WhatsApp, atau kode pos tidak valid.');
    return value;
  }
  async function payment(body) {
    if(!env.MIDTRANS_SERVER_KEY?.startsWith('SB-Mid-server-'))fail('Pembayaran uji coba belum aktif. Masukkan server key sandbox Midtrans.',503);
    const q=quotes.get(body.quoteId);
    if(!q||q.expires<now())fail('Tarif sudah kedaluwarsa. Cek ongkir kembali.',409);
    const items=canonical(body.items),recipient=customer(body.customer);
    if(JSON.stringify(items)!==JSON.stringify(q.items)||recipient.postal!==q.postal)fail('Keranjang atau alamat berubah. Cek ongkir kembali.',409);
    const chosen=q.rates.find(r=>r.id===body.rateId);if(!chosen)fail('Pilih kurir yang tersedia.');
    const key=`${body.quoteId}:${body.rateId}`;
    const fingerprint=JSON.stringify(recipient);
    if(sessions.has(key)) {
      const existing=sessions.get(key);
      if(existing.fingerprint!==fingerprint)fail('Data penerima berubah. Cek ongkir kembali.',409);
      return existing.operation;
    }
    const operation=(async()=>{
      const latest=(await getRates(q.postal,q.items)).find(r=>r.id===chosen.id);
      if(!latest||latest.price!==chosen.price)fail('Tarif berubah. Cek ongkir kembali sebelum membayar.',409);
      const item_details=items.map(item=>{const p=catalog.find(p=>p.id===item.id);return {id:p.id,price:p.price,quantity:item.quantity,name:p.name.slice(0,50)};});
      item_details.push({id:'shipping',name:'Ongkir',quantity:1,price:latest.price});
      const total=item_details.reduce((sum,p)=>sum+p.price*p.quantity,0);
      const orderId=`CL-TEST-${randomUUID()}`;
      const response=await request('https://app.sandbox.midtrans.com/snap/v1/transactions',{
        method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:`Basic ${Buffer.from(env.MIDTRANS_SERVER_KEY+':').toString('base64')}`},signal:AbortSignal.timeout(15000),
        body:JSON.stringify({transaction_details:{order_id:orderId,gross_amount:total},item_details,
          customer_details:{first_name:recipient.name,email:recipient.email,phone:recipient.phone,shipping_address:{first_name:recipient.name,phone:recipient.phone,address:`${recipient.address}, ${recipient.village}, ${recipient.district}, ${recipient.province}`,city:recipient.city,postal_code:recipient.postal,country_code:'IDN'}}})
      });
      if(!response.ok)fail('Sesi pembayaran belum dapat dibuat. Periksa dashboard sandbox sebelum mencoba tarif baru.',502);
      const data=await response.json();let url;try{url=new URL(data.redirect_url);}catch{fail('Respons pembayaran tidak valid.',502);}
      if(url.protocol!=='https:'||url.hostname!=='app.sandbox.midtrans.com')fail('Alamat pembayaran tidak valid.',502);
      return {redirectUrl:url.href,orderId,total,mode:'sandbox'};
    })();
    sessions.set(key,{fingerprint,operation});return operation;
  }
  return {quote,payment,canonical};
}

function createServer(service=createService()) {
  const allowed=new Set(['index.html','styles.css','marketplace.css','storefront.css','commerce.css','signature.css','app.js','commerce.js','product-data.js']);
  const buckets=new Map();
  return http.createServer(async(req,res)=>{
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
    try {
      const pathname=new URL(req.url,'http://localhost').pathname;
      if(pathname.startsWith('/api/')){
        if(req.method!=='POST')return json(405,{error:'Metode tidak tersedia.'});
        const host=req.headers.host;
        if(!host||(!/^127\.0\.0\.1:\d+$/.test(host)&&!/^localhost:\d+$/.test(host)))return json(403,{error:'Host tidak diizinkan.'});
        if(req.headers.origin&&req.headers.origin!==`http://${host}`)return json(403,{error:'Origin tidak diizinkan.'});
        if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'Gunakan JSON.'});
        const minute=Math.floor(Date.now()/60000),ip=req.socket.remoteAddress;
        if(buckets.get(ip)?.minute!==minute)buckets.set(ip,{minute,count:0});
        if(++buckets.get(ip).count>30)return json(429,{error:'Terlalu banyak permintaan. Tunggu satu menit.'});
        let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16384)return json(413,{error:'Permintaan terlalu besar.'});}
        let body;try{body=JSON.parse(raw);}catch{return json(400,{error:'JSON tidak valid.'});}
        if(!body||typeof body!=='object')return json(400,{error:'Data tidak valid.'});
        if(pathname==='/api/shipping/quotes')return json(200,await service.quote(body));
        if(pathname==='/api/payments/session')return json(200,await service.payment(body));
        return json(404,{error:'API tidak ditemukan.'});
      }
      if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'Metode tidak tersedia.'});
      const file=pathname==='/'?'index.html':pathname.slice(1);
      if(!allowed.has(file)&&!/^assets\/[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(file))return json(404,{error:'Tidak ditemukan.'});
      const data=await fs.readFile(path.join(__dirname,file));
      const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
      res.writeHead(200,{'Content-Type':mime[path.extname(file)],'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':'no-cache'});
      res.end(req.method==='HEAD'?undefined:data);
    }catch(error){json(error.status||503,{error:error.status?error.message:'Layanan integrasi sedang tidak tersedia. Coba lagi.'});}
  });
}
if(require.main===module)createServer().listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Crystal Lim sandbox server ready on port '+(process.env.PORT||4173)));
module.exports={createService,createServer};
