const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createService,createServer}=require('./server.cjs');
const product=require('./product-data.js')[0];
const items=[{id:product.id,quantity:1}];
const customer={name:'Test Buyer',phone:'081234567890',email:'test@example.com',province:'Jawa Timur',city:'Surabaya',district:'Test',village:'Test',address:'Alamat pengujian',postal:'60241'};
function fixture(){
  let price=19000,now=1000;const calls=[];
  const env={BITESHIP_API_KEY:'test-key',ORIGIN_POSTAL_CODE:'68411',MIDTRANS_SERVER_KEY:'SB-Mid-server-test',SHIPPING_PACKAGES_JSON:JSON.stringify({[product.id]:{weight:500,length:20,width:15,height:10}})};
  const request=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>url.includes('biteship')?{success:true,pricing:[{courier_code:'jne',courier_service_code:'reg',courier_name:'JNE',courier_service_name:'Reguler',price,duration:'2-3 days'}]}:{redirect_url:'https://app.sandbox.midtrans.com/snap/test'}};};
  return {service:createService({env,request,now:()=>now}),env,calls,setPrice:n=>price=n,expire:()=>now+=600001};
}
test('fails closed without API setup',async()=>{
  const s=createService({env:{},request:()=>assert.fail('No external call allowed')});
  await assert.rejects(s.quote({postal:'60241',items}),/API ongkir belum aktif/);
});
test('requires measured packed dimensions and weight',async()=>{
  const f=fixture();f.env.SHIPPING_PACKAGES_JSON='{}';await assert.rejects(f.service.quote({postal:'60241',items}),/Berat dan ukuran/);assert.equal(f.calls.length,0);
});
test('rejects invalid cart and postcode',async()=>{
  const f=fixture();await assert.rejects(f.service.quote({postal:'x',items}),/Kode pos/);
  assert.throws(()=>f.service.canonical([{id:'invented',quantity:1}]),/Produk/);
  assert.throws(()=>f.service.canonical([{id:product.id,quantity:-1}]),/Produk/);
  assert.throws(()=>f.service.canonical([{id:product.id,quantity:10},{id:product.id,quantity:2}]),/Maksimal/);
});
test('uses server prices and actual API rate',async()=>{
  const f=fixture(),q=await f.service.quote({postal:'60241',items:[{...items[0],price:1,weight:1}]});
  assert.equal(q.rates[0].price,19000);assert.equal(f.calls[0].body.items[0].value,product.price);assert.equal(f.calls[0].body.items[0].weight,500);
});
test('payment rechecks rate and reuses session on retry',async()=>{
  const f=fixture(),q=await f.service.quote({postal:'60241',items}),body={quoteId:q.id,rateId:q.rates[0].id,customer,items,total:1};
  const [a,b]=await Promise.all([f.service.payment(body),f.service.payment(body)]);
  assert.equal(a.orderId,b.orderId);assert.equal(a.total,product.price+19000);assert.equal(f.calls.filter(c=>c.url.includes('midtrans')).length,1);
});
test('changed tariff blocks payment',async()=>{
  const f=fixture(),q=await f.service.quote({postal:'60241',items});f.setPrice(20000);
  await assert.rejects(f.service.payment({quoteId:q.id,rateId:q.rates[0].id,customer,items}),/Tarif berubah/);
  assert.equal(f.calls.filter(c=>c.url.includes('midtrans')).length,0);
});
test('expired quote and changed destination/cart block payment',async()=>{
  const f=fixture(),q=await f.service.quote({postal:'60241',items}),body={quoteId:q.id,rateId:q.rates[0].id,customer,items};
  await assert.rejects(f.service.payment({...body,customer:{...customer,postal:'12345'}}),/alamat berubah/);
  await assert.rejects(f.service.payment({...body,items:[{id:product.id,quantity:2}]}),/Keranjang/);
  f.expire();await assert.rejects(f.service.payment(body),/kedaluwarsa/);
});
test('production key is rejected',async()=>{const f=fixture();f.env.MIDTRANS_SERVER_KEY='Mid-server-live';await assert.rejects(f.service.payment({}),/sandbox/);});
test('session cannot be reused with different recipient',async()=>{
  const f=fixture(),q=await f.service.quote({postal:'60241',items}),body={quoteId:q.id,rateId:q.rates[0].id,customer,items};
  await f.service.payment(body);
  await assert.rejects(f.service.payment({...body,customer:{...customer,address:'Alamat berbeda'}}),/penerima berubah/);
});
test('local server serves the final hero stylesheet',async()=>{
  const server=createServer(createService({env:{}}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const response=await fetch(`http://127.0.0.1:${server.address().port}/signature.css`);
    assert.equal(response.status,200);
    assert.match(response.headers.get('content-type'),/text\/css/);
    assert.match(await response.text(),/collection-signature/);
  } finally {
    await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  }
});
