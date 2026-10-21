(() => {
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const products = window.crystalCatalog;
  const detail = document.createElement('section');
  detail.className = 'product-detail'; detail.hidden = true;
  qs('main').after(detail);
  let activeProduct, activeImage = 0, opener, previousScroll = 0;
  function showImage(index) {
    activeImage = (index + activeProduct.images.length) % activeProduct.images.length;
    qs('.detail-main-image', detail).src = activeProduct.images[activeImage];
    qs('.detail-image-count', detail).textContent = `${activeImage + 1} / ${activeProduct.images.length}`;
    qsa('.detail-thumb', detail).forEach((button,i) => button.setAttribute('aria-pressed', String(i === activeImage)));
  }
  function closeDetail() {
    detail.hidden = true; qs('main').hidden = false;
    window.scrollTo(0,previousScroll); opener?.focus({preventScroll:true});
  }
  function navigateCatalog(target='#top') {
    if (!detail.hidden) closeDetail();
    qs(target)?.scrollIntoView({block:'start'});
  }
  window.addEventListener('catalog:navigate', event => navigateCatalog(event.detail));
  qsa('a[href="#top"],a[href="#pilihan"]').forEach(link => {
    link.addEventListener('click', event => { event.preventDefault(); navigateCatalog(link.hash === '#pilihan' ? '#pilihan' : '#top'); });
  });
  function openDetail(product, source) {
    opener = source; previousScroll = window.scrollY; activeProduct = product;
    const stock = Number.isFinite(product.stock) ? product.stock : 10;
    const outOfStock = stock <= 0;
    const maxQty = Math.max(1, Math.min(10, stock));
    const stockNote = outOfStock ? 'Stok habis saat ini — nantikan restock.' : (stock <= 5 ? `Tersisa ${stock} buah.` : '');
    detail.innerHTML = `<button class="detail-back" type="button">← Kembali ke koleksi</button>
      <div class="detail-layout"><div class="detail-gallery">
        <div class="detail-image-wrap"><img class="detail-main-image" src="${esc(product.image)}" alt="${esc(product.name)}"><span class="detail-image-count"></span></div>
        <div class="detail-gallery-nav"><button class="image-prev" aria-label="Foto sebelumnya">←</button><span>Detail produk asli Crystal Lim</span><button class="image-next" aria-label="Foto berikutnya">→</button></div>
        <div class="detail-thumbnails">${product.images.map((src,i)=>`<button class="detail-thumb" data-index="${i}" aria-label="Lihat foto ${i+1}" aria-pressed="false"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>
      </div><div class="detail-copy"><p class="eyebrow">THE COLLECTION / CRYSTAL LIM</p><h1>${esc(product.name)}</h1><strong class="detail-price">${rupiah.format(product.price)}</strong>
      <p class="detail-description">${esc(product.description)}</p>${stockNote ? `<p class="detail-stock-note">${esc(stockNote)}</p>` : ''}
      <label class="detail-quantity"${outOfStock ? ' hidden' : ''}>Jumlah <input type="number" min="1" max="${maxQty}" step="1" value="1" inputmode="numeric" required${outOfStock ? ' disabled' : ''}></label>
      <button class="detail-buy" type="button"${outOfStock ? ' disabled' : ''}>${outOfStock ? 'Stok habis' : 'Lanjut isi alamat <span>→</span>'}</button>
      <button class="detail-add" type="button"${outOfStock ? ' disabled' : ''}>Tambahkan ke keranjang</button><p class="detail-feedback" role="status"></p>
      <div class="detail-facts"><p><b>Pengiriman</b><span>Tarif API setelah alamat diisi</span></p><p><b>Pembayaran</b><span>Integrasi sedang disiapkan</span></p></div>
      <a class="detail-source" href="${esc(product.url)}" target="_blank" rel="noopener">Lihat spesifikasi di situs asli ↗</a></div></div>`;
    qs('main').hidden = true; detail.hidden = false; window.scrollTo(0,0);
    qs('.detail-back',detail).addEventListener('click',closeDetail);
    qs('.image-prev',detail).addEventListener('click',()=>showImage(activeImage-1));
    qs('.image-next',detail).addEventListener('click',()=>showImage(activeImage+1));
    qsa('.detail-thumb',detail).forEach(b=>b.addEventListener('click',()=>showImage(Number(b.dataset.index))));
    const add = (ensureQuantity = false) => {
      if(outOfStock) return false;
      const input=qs('.detail-quantity input',detail);
      if(!input.reportValidity()) return false;
      const existing=cart.filter(p=>p.id===product.id).length;
      const count=ensureQuantity ? Math.max(0,Number(input.value)-existing) : Number(input.value);
      if(existing+count>maxQty){qs('.detail-feedback',detail).textContent=`Maksimal ${maxQty} buah per produk (sesuai stok tersedia). Ubah jumlah di keranjang.`;return false;}
      for(let i=0;i<count;i++) cart.push({id:product.id,name:product.name,price:product.price,image:product.image});
      renderCart(); return true;
    };
    qs('.detail-add',detail).addEventListener('click',()=>{if(add()) qs('.detail-feedback',detail).textContent='Produk ditambahkan ke keranjang.';});
    qs('.detail-buy',detail).addEventListener('click',()=>{if(add(true)) openCheckout();});
    qs('.detail-main-image',detail).addEventListener('error',event=>{ if(event.target.getAttribute('src')!==product.image) { event.target.src=product.image; qs('.detail-image-count',detail).textContent='Foto tambahan belum termuat'; } });
    showImage(0); qs('.detail-back',detail).focus();
  }
  qsa('.product').forEach(card=>{
    const product=products.find(p=>p.id===card.dataset.id);
    qsa('.add-button,.product-media > a,.product-info h3 > a',card).forEach(el=>el.addEventListener('click',event=>{event.preventDefault();openDetail(product,el);}));
  });
  document.addEventListener('keydown',event=>{if(!event.defaultPrevented&&event.key==='Escape'&&!detail.hidden&&!checkout.classList.contains('open')&&!drawer.classList.contains('open')) closeDetail();});
  const savedAddresses = window.crystalUser?.addresses || [];
  if (savedAddresses.length) {
    const wrap = qs('#saved-addresses');
    wrap.hidden = false;
    wrap.innerHTML = `<p class="shipping-help">Pakai alamat tersimpan:</p><div class="saved-address-options">${savedAddresses.map((a,i)=>`<button type="button" class="saved-address-option" data-index="${i}">${esc(a.label)}</button>`).join('')}</div>`;
    qsa('.saved-address-option', wrap).forEach(button => button.addEventListener('click', () => {
      const addr = savedAddresses[Number(button.dataset.index)];
      const formEl = qs('.checkout-form');
      for (const key of ['recipientName','phone','province','city','district','village','address','postal']) {
        const field = key === 'recipientName' ? 'name' : key;
        if (formEl.elements[field]) formEl.elements[field].value = addr[key];
      }
    }));
  }
  const form=qs('.checkout-form'), payStatus=qs('#payment-status'), payButton=qs('.place-order');
  const quoteButton=qs('#quote-shipping'), shippingStatus=qs('#shipping-status'), shippingOptionsEl=qs('#shipping-options');
  const shippingMode=window.crystalShipping?.mode==='flat' ? 'flat' : 'auto';
  let paying=false, paymentController=null, quoting=false, selectedShipping=null;
  const items=()=>Object.values(cart.reduce((all,p)=>{const id=p.id||products.find(x=>x.name===p.name)?.id;if(!all[id])all[id]={id,quantity:0};all[id].quantity++;return all;},{}));
  if(shippingMode==='flat'){
    qs('#shipping-flat-note').hidden=false;
    qs('#shipping-fee-display').textContent=rupiah.format(window.crystalShipping?.flatFee||0);
  }else{
    qs('#shipping-auto-section').hidden=false;
  }
  function updateShippingTotal() {
    const fee=shippingMode==='auto' ? (selectedShipping?.cost ?? (window.crystalShipping?.flatFee||0)) : (window.crystalShipping?.flatFee||0);
    qs('#shipping-total').textContent=rupiah.format(fee);
    qs('.summary-total').textContent=rupiah.format(cartSubtotal()+fee);
  }
  window.addEventListener('cart:changed',()=>{
    if(selectedShipping){selectedShipping=null;shippingOptionsEl.innerHTML='';shippingStatus.textContent='Keranjang berubah — cek ongkos kirim lagi.';}
    updateShippingTotal();
  });
  window.addEventListener('checkout:closed',()=>{paymentController?.abort();});
  updateShippingTotal();
  async function api(path,body,signal) {
    const response=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw Error(data.error||'Permintaan gagal. Coba lagi.');
    return data;
  }
  function selectShipping(option) { selectedShipping=option; updateShippingTotal(); }
  function renderShippingOptions(options) {
    shippingOptionsEl.innerHTML=options.map((o,i)=>`<label class="shipping-option">
      <input type="radio" name="shipping-option" value="${i}"${i===0?' checked':''}>
      <span><b>${esc(o.courierName)} — ${esc(o.service)}</b><small>${esc(o.description)} · estimasi ${esc(o.etd)}</small></span>
      <strong>${rupiah.format(o.cost)}</strong>
    </label>`).join('');
    qsa('input[name="shipping-option"]',shippingOptionsEl).forEach((input,i)=>input.addEventListener('change',()=>selectShipping(options[i])));
    if(options.length) selectShipping(options[0]);
  }
  const ADDRESS_FIELDS=['province','city','district','village','address','postal'];
  function addressFieldsValid() {
    for(const name of ADDRESS_FIELDS){ const el=form.elements[name]; if(el && !el.reportValidity()) return false; }
    return true;
  }
  quoteButton?.addEventListener('click',async()=>{
    if(quoting) return;
    if(!addressFieldsValid()) return;
    if(!cart.length){shippingStatus.textContent='Keranjang masih kosong.';return;}
    quoting=true;quoteButton.disabled=true;shippingStatus.textContent='Mencari opsi pengiriman…';shippingOptionsEl.innerHTML='';
    try{
      const data=await api('/api/shipping/quote',{postal:form.elements.postal.value,items:items()});
      shippingStatus.textContent='';
      renderShippingOptions(data.options);
    }catch(error){
      shippingStatus.textContent=error.message;
      selectedShipping=null;updateShippingTotal();
    }finally{quoting=false;quoteButton.disabled=false;}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(paying||!form.reportValidity()||!cart.length)return;
    paying=true;payButton.disabled=true;payStatus.textContent='Menyiapkan pembayaran…';
    const customer=Object.fromEntries(new FormData(form));
    if(selectedShipping){customer.shippingCourier=selectedShipping.courier;customer.shippingService=selectedShipping.service;}
    qsa('input,textarea,button',form).forEach(el=>el.disabled=true);
    paymentController=new AbortController();const timeout=setTimeout(()=>paymentController.abort(),25000);
    try{
      const data=await api('/api/checkout',{customer,items:items()},paymentController.signal);
      const url=new URL(data.redirectUrl);if(url.protocol!=='https:'||!/^checkout(-staging)?\.xendit\.co$/.test(url.hostname))throw Error('Alamat pembayaran tidak valid.');
      location.assign(url.href);
    }catch(error){payStatus.textContent=error.name==='AbortError'?'Permintaan terlalu lama. Coba lagi.':error.message;}
    finally{clearTimeout(timeout);paying=false;qsa('input,textarea,button',form).forEach(el=>el.disabled=false);payButton.disabled=false;}
  });
})();
