(() => {
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t = (...args) => window.crystalI18n.t(...args);
  const products = window.crystalCatalog;
  const detail = document.createElement('section');
  detail.className = 'product-detail'; detail.hidden = true;
  qs('main').after(detail);
  let activeProduct, activeImage = 0, opener, previousScroll = 0, selectedVariantId = null;
  function currentVariant() {
    return activeProduct.variants?.find(v => v.id === selectedVariantId) ?? null;
  }
  function variantState() {
    const variant = currentVariant();
    const price = variant ? variant.price : activeProduct.price;
    const stock = variant ? variant.stock : (Number.isFinite(activeProduct.stock) ? activeProduct.stock : 10);
    const outOfStock = stock <= 0;
    const maxQty = Math.max(1, Math.min(10, stock));
    const stockNote = outOfStock ? t('detail.outOfStockNote') : (stock <= 5 ? t('detail.lowStockNote', { stock }) : '');
    return { price, stock, outOfStock, maxQty, stockNote };
  }
  function youtubeId(url) {
    const match = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{6,})/.exec(url || '');
    return match ? match[1] : null;
  }
  function youtubeEmbedUrl(url) {
    const id = youtubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  function youtubeThumbnailUrl(url) {
    const id = youtubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }
  // Video file (bukan link YouTube) tidak punya thumbnail siap pakai — ambil
  // sendiri satu frame-nya lewat <video>+<canvas> di browser, tanpa perlu
  // olah video di server (ffmpeg dll).
  function generateVideoThumbnail(videoSrc, imgEl) {
    const video = document.createElement('video');
    video.src = videoSrc; video.muted = true; video.playsInline = true; video.preload = 'metadata';
    video.addEventListener('loadeddata', () => { video.currentTime = Math.min(0.5, (video.duration || 1) / 2); });
    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        imgEl.src = canvas.toDataURL('image/jpeg', 0.7);
      } catch { /* biarkan fallback foto utama kalau gagal (mis. format tidak didukung) */ }
    }, { once: true });
  }
  function mediaList() {
    const videos = (activeProduct.videos || []).map(src => ({ type: 'video', src }));
    const images = activeProduct.images.map(src => ({ type: 'image', src }));
    return [...videos, ...images];
  }
  function showMedia(index) {
    const media = mediaList();
    activeImage = (index + media.length) % media.length;
    const item = media[activeImage];
    const img = qs('.detail-main-image', detail), video = qs('.detail-main-video', detail), yt = qs('.detail-main-youtube', detail);
    const embedUrl = item.type === 'video' ? youtubeEmbedUrl(item.src) : null;
    if (item.type === 'video' && embedUrl) {
      yt.src = embedUrl; yt.hidden = false; img.hidden = true;
      video.pause(); video.removeAttribute('src'); video.load(); video.hidden = true;
    } else if (item.type === 'video') {
      video.src = item.src; video.hidden = false; img.hidden = true;
      yt.src = ''; yt.hidden = true;
    } else {
      video.pause(); video.removeAttribute('src'); video.load(); video.hidden = true;
      yt.src = ''; yt.hidden = true;
      img.src = item.src; img.hidden = false;
    }
    qs('.detail-image-count', detail).textContent = `${activeImage + 1} / ${media.length}`;
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
    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
    selectedVariantId = hasVariants ? product.variants[0].id : null;
    const state = variantState();
    const media = mediaList();
    detail.innerHTML = `<button class="detail-back" type="button">${t('detail.back')}</button>
      <div class="detail-layout"><div class="detail-gallery">
        <div class="detail-image-wrap"><img class="detail-main-image" src="${esc(product.image)}" alt="${esc(product.name)}"><video class="detail-main-video" controls playsinline preload="metadata" hidden></video><iframe class="detail-main-youtube" title="${esc(product.name)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen hidden></iframe><span class="detail-image-count"></span></div>
        <div class="detail-gallery-nav"><button class="image-prev" aria-label="${t('detail.prevPhoto')}">←</button><span>${t('detail.originalPhotos')}</span><button class="image-next" aria-label="${t('detail.nextPhoto')}">→</button></div>
        <div class="detail-thumbnails">${media.map((m,i)=>{
          if (m.type !== 'video') return `<button class="detail-thumb" data-index="${i}" aria-label="${t('detail.viewPhoto', { index: i + 1 })}" aria-pressed="false"><img src="${esc(m.src)}" alt="" loading="lazy"></button>`;
          const ytThumb = youtubeThumbnailUrl(m.src);
          const thumbSrc = ytThumb || product.image;
          return `<button class="detail-thumb detail-thumb-video" data-index="${i}" aria-label="${t('detail.viewVideo')}" aria-pressed="false"><img src="${esc(thumbSrc)}" alt="" loading="lazy"${ytThumb ? '' : ` data-video-src="${esc(m.src)}"`}><span class="thumb-play" aria-hidden="true">▶</span></button>`;
        }).join('')}</div>
      </div><div class="detail-copy"><p class="eyebrow">${t('detail.eyebrow')}</p><h1>${esc(product.name)}</h1><strong class="detail-price">${rupiah.format(state.price)}</strong>
      <p class="detail-description">${esc(product.description)}</p><p class="detail-stock-note"${state.stockNote ? '' : ' hidden'}>${esc(state.stockNote)}</p>
      ${hasVariants ? `<label class="detail-variant">${t('detail.chooseVariant')} <select class="detail-variant-select">${product.variants.map(v=>`<option value="${v.id}">${esc(v.label)}</option>`).join('')}</select></label>` : ''}
      <label class="detail-quantity"${state.outOfStock ? ' hidden' : ''}>${t('detail.quantity')} <input type="number" min="1" max="${state.maxQty}" step="1" value="1" inputmode="numeric" required${state.outOfStock ? ' disabled' : ''}></label>
      <button class="detail-buy" type="button"${state.outOfStock ? ' disabled' : ''}>${state.outOfStock ? t('detail.outOfStockButton') : `${t('detail.continueToAddress')}`}</button>
      <button class="detail-add" type="button"${state.outOfStock ? ' disabled' : ''}>${t('detail.addToCart')}</button><p class="detail-feedback" role="status"></p>
      <div class="detail-facts"><p><b>${t('detail.shippingLabel')}</b><span>${t('detail.shippingValue')}</span></p><p><b>${t('detail.paymentLabel')}</b><span>${t('detail.paymentValue')}</span></p></div>
      <a class="detail-source" href="${esc(product.url)}" target="_blank" rel="noopener">${t('detail.viewSource')}</a></div></div>`;
    qs('main').hidden = true; detail.hidden = false; window.scrollTo(0,0);
    qs('.detail-back',detail).addEventListener('click',closeDetail);
    qs('.image-prev',detail).addEventListener('click',()=>showMedia(activeImage-1));
    qs('.image-next',detail).addEventListener('click',()=>showMedia(activeImage+1));
    qsa('.detail-thumb',detail).forEach(b=>b.addEventListener('click',()=>showMedia(Number(b.dataset.index))));
    function refreshForVariant() {
      const next = variantState();
      qs('.detail-price',detail).textContent = rupiah.format(next.price);
      const note = qs('.detail-stock-note',detail);
      note.textContent = next.stockNote; note.hidden = !next.stockNote;
      const qtyLabel = qs('.detail-quantity',detail), qtyInput = qs('.detail-quantity input',detail);
      qtyLabel.hidden = next.outOfStock;
      qtyInput.max = next.maxQty; qtyInput.disabled = next.outOfStock;
      if (Number(qtyInput.value) > next.maxQty) qtyInput.value = next.maxQty;
      const buy = qs('.detail-buy',detail), addBtn = qs('.detail-add',detail);
      buy.disabled = next.outOfStock; addBtn.disabled = next.outOfStock;
      buy.textContent = next.outOfStock ? t('detail.outOfStockButton') : t('detail.continueToAddress');
      qs('.detail-feedback',detail).textContent = '';
    }
    qs('.detail-variant-select',detail)?.addEventListener('change', event => {
      selectedVariantId = Number(event.target.value); refreshForVariant();
    });
    const add = (ensureQuantity = false) => {
      const state = variantState();
      if(state.outOfStock) return false;
      const input=qs('.detail-quantity input',detail);
      if(!input.reportValidity()) return false;
      const variant = currentVariant();
      const existing=cart.filter(p=>p.id===product.id && (p.variantId??null)===(variant?.id??null)).length;
      const count=ensureQuantity ? Math.max(0,Number(input.value)-existing) : Number(input.value);
      if(existing+count>state.maxQty){qs('.detail-feedback',detail).textContent=t('detail.maxQuantity', { max: state.maxQty });return false;}
      const name = variant ? `${product.name} — ${variant.label}` : product.name;
      for(let i=0;i<count;i++) cart.push({id:product.id,variantId:variant?.id??null,name,price:state.price,image:product.image});
      renderCart(); return true;
    };
    qs('.detail-add',detail).addEventListener('click',()=>{if(add()) qs('.detail-feedback',detail).textContent=t('detail.addedToCart');});
    qs('.detail-buy',detail).addEventListener('click',()=>{if(add(true)) openCheckout();});
    qs('.detail-main-image',detail).addEventListener('error',event=>{ if(event.target.getAttribute('src')!==product.image) { event.target.src=product.image; qs('.detail-image-count',detail).textContent=t('detail.photoNotLoaded'); } });
    qsa('.detail-thumb-video img[data-video-src]', detail).forEach(img => generateVideoThumbnail(img.dataset.videoSrc, img));
    showMedia(0); qs('.detail-back',detail).focus();
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
    wrap.innerHTML = `<p class="shipping-help">${t('checkout.savedAddresses')}</p><div class="saved-address-options">${savedAddresses.map((a,i)=>`<button type="button" class="saved-address-option" data-index="${i}">${esc(a.label)}</button>`).join('')}</div>`;
    qsa('.saved-address-option', wrap).forEach(button => button.addEventListener('click', () => {
      const addr = savedAddresses[Number(button.dataset.index)];
      const formEl = qs('.checkout-form');
      for (const key of ['recipientName','phone','province','city','district','village','address','postal']) {
        const field = key === 'recipientName' ? 'name' : key;
        if (formEl.elements[field]) formEl.elements[field].value = addr[key];
      }
      qsa('.saved-address-option', wrap).forEach(b => b.classList.toggle('active', b === button));
    }));
  }
  const form=qs('.checkout-form'), payStatus=qs('#payment-status'), payButton=qs('.place-order');
  if (window.crystalUser?.loggedIn && form.elements.email) {
    form.elements.email.value = window.crystalUser.email || '';
    form.elements.email.readOnly = true;
  }
  const quoteButton=qs('#quote-shipping'), shippingStatus=qs('#shipping-status'), shippingOptionsEl=qs('#shipping-options');
  const shippingMode=window.crystalShipping?.mode==='flat' ? 'flat' : 'auto';
  let paying=false, paymentController=null, quoting=false, selectedShipping=null, selectedInternational=null;
  const items=()=>Object.values(cart.reduce((all,p)=>{const id=p.id||products.find(x=>x.name===p.name)?.id;const variantId=p.variantId??null;const key=`${id}::${variantId??''}`;if(!all[key])all[key]={id,variantId,quantity:0};all[key].quantity++;return all;},{}));

  // --- Negara & pengiriman internasional ---
  const COUNTRIES=['Indonesia','Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (Brazzaville)','Congo (DR)','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hong Kong','Hungary','Iceland','India','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];
  const countrySelect=qs('#checkout-country');
  const domesticOnlyFields=qs('#domestic-only-fields');
  const shippingFlatNoteEl=qs('#shipping-flat-note');
  const shippingAutoSectionEl=qs('#shipping-auto-section');
  const shippingIntlSectionEl=qs('#shipping-international-section');
  const intlOptionsEl=qs('#shipping-international-options');
  const postalInput=form.elements.postal;
  if(countrySelect){
    countrySelect.innerHTML=COUNTRIES.map(name=>`<option value="${esc(name)}"${name==='Indonesia'?' selected':''}>${esc(name)}</option>`).join('');
  }
  function isInternational(){ return countrySelect && countrySelect.value!=='Indonesia'; }
  function renderInternationalOptions(){
    const standardFee=window.crystalShipping?.internationalStandardFee||0;
    const expressFee=window.crystalShipping?.internationalExpressFee||0;
    const options=[
      {method:'intl_standard',labelKey:'checkout.internationalStandard',cost:standardFee},
      {method:'intl_express',labelKey:'checkout.internationalExpress',cost:expressFee},
    ];
    intlOptionsEl.innerHTML=options.map((o,i)=>`<label class="shipping-option">
      <input type="radio" name="international-shipping-option" value="${o.method}"${i===0?' checked':''}>
      <span><b>${t(o.labelKey)}</b></span>
      <strong>${rupiah.format(o.cost)}</strong>
    </label>`).join('');
    qsa('input[name="international-shipping-option"]',intlOptionsEl).forEach((input,i)=>input.addEventListener('change',()=>{selectedInternational=options[i];updateShippingTotal();}));
    selectedInternational=options[0];
  }
  // --- Metode pembayaran & biaya admin ---
  // Tarif publik umum Xendit (perkiraan) — HARUS sinkron dengan FEE_RULES di
  // lib/payment-fees.ts. Di sini cuma untuk preview sebelum submit; server
  // yang menghitung ulang & jadi acuan final nominal yang ditagih.
  const PAYMENT_METHODS=[
    {key:'qris',labelKey:'checkout.paymentQris',percent:0.007,flat:0},
    {key:'va',labelKey:'checkout.paymentVa',percent:0,flat:4000},
    {key:'ewallet',labelKey:'checkout.paymentEwallet',percent:0.02,flat:0},
    {key:'card',labelKey:'checkout.paymentCard',percent:0.029,flat:2000},
  ];
  const paymentOptionsEl=qs('#payment-method-options');
  let selectedPaymentMethod=PAYMENT_METHODS[0];
  function paymentFeeFor(method,baseAmount){ return Math.ceil(baseAmount*method.percent+method.flat); }
  function currentShippingFee(){
    return isInternational()
      ? (selectedInternational?.cost||0)
      : (shippingMode==='auto' ? (selectedShipping?.cost ?? (window.crystalShipping?.flatFee||0)) : (window.crystalShipping?.flatFee||0));
  }
  function renderPaymentOptions(){
    const base=cartSubtotal()+currentShippingFee();
    paymentOptionsEl.innerHTML=PAYMENT_METHODS.map(m=>`<label class="shipping-option">
      <input type="radio" name="payment-method-option" value="${m.key}"${m.key===selectedPaymentMethod.key?' checked':''}>
      <span><b>${t(m.labelKey)}</b></span>
      <strong>+${rupiah.format(paymentFeeFor(m,base))}</strong>
    </label>`).join('');
    qsa('input[name="payment-method-option"]',paymentOptionsEl).forEach((input,i)=>input.addEventListener('change',()=>{selectedPaymentMethod=PAYMENT_METHODS[i];updateShippingTotal();}));
  }
  const provinceInput=form.elements.province;
  const provinceOptionalHint=qs('.field-optional-hint',provinceInput?.closest('label'));
  function applyDestinationMode(){
    const intl=isInternational();
    domesticOnlyFields.hidden=intl;
    qsa('input',domesticOnlyFields).forEach(el=>{ el.required=!intl; });
    if(provinceInput){ provinceInput.required=!intl; }
    if(provinceOptionalHint){ provinceOptionalHint.hidden=!intl; }
    if(intl){
      postalInput.removeAttribute('pattern'); postalInput.removeAttribute('inputmode');
      shippingFlatNoteEl.hidden=true; shippingAutoSectionEl.hidden=true;
      shippingIntlSectionEl.hidden=false;
      selectedShipping=null; shippingOptionsEl.innerHTML=''; shippingStatus.textContent='';
      renderInternationalOptions();
    }else{
      postalInput.setAttribute('pattern','[0-9]{5}'); postalInput.setAttribute('inputmode','numeric');
      shippingIntlSectionEl.hidden=true;
      selectedInternational=null;
      if(shippingMode==='flat'){ shippingFlatNoteEl.hidden=false; } else { shippingAutoSectionEl.hidden=false; }
    }
    updateShippingTotal();
  }
  countrySelect?.addEventListener('change',applyDestinationMode);

  function updateShippingTotal() {
    const fee=currentShippingFee();
    qs('#shipping-total').textContent=rupiah.format(fee);
    renderPaymentOptions();
    const paymentFee=paymentFeeFor(selectedPaymentMethod,cartSubtotal()+fee);
    qs('#payment-fee-total').textContent=rupiah.format(paymentFee);
    qs('.summary-total').textContent=rupiah.format(cartSubtotal()+fee+paymentFee);
  }
  applyDestinationMode();
  window.addEventListener('cart:changed',()=>{
    if(selectedShipping){selectedShipping=null;shippingOptionsEl.innerHTML='';shippingStatus.textContent=t('checkout.cartChanged');}
    updateShippingTotal();
  });
  window.addEventListener('checkout:closed',()=>{paymentController?.abort();});
  async function api(path,body,signal) {
    const response=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw Error(data.error||t('checkout.genericError'));
    return data;
  }
  function selectShipping(option) { selectedShipping=option; updateShippingTotal(); }
  function renderShippingOptions(options) {
    shippingOptionsEl.innerHTML=options.map((o,i)=>`<label class="shipping-option">
      <input type="radio" name="shipping-option" value="${i}"${i===0?' checked':''}>
      <span><b>${esc(o.courierName)} — ${esc(o.service)}</b><small>${esc(o.description)} · ${t('checkout.estimate')} ${esc(o.etd)}</small></span>
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
    if(!cart.length){shippingStatus.textContent=t('checkout.cartEmpty');return;}
    quoting=true;quoteButton.disabled=true;shippingStatus.textContent=t('checkout.searchingShipping');shippingOptionsEl.innerHTML='';
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
    paying=true;payButton.disabled=true;payStatus.textContent=t('checkout.preparingPayment');
    const customer=Object.fromEntries(new FormData(form));
    customer.paymentMethod=selectedPaymentMethod.key;
    if(isInternational()){ if(selectedInternational) customer.shippingMethod=selectedInternational.method; }
    else if(selectedShipping){customer.shippingCourier=selectedShipping.courier;customer.shippingService=selectedShipping.service;}
    qsa('input,textarea,button',form).forEach(el=>el.disabled=true);
    // Buka tab kosong sekarang juga (masih dalam gesture klik submit) supaya
    // tidak diblokir popup-blocker — baru diarahkan ke invoice setelah
    // /api/checkout selesai (await membuat jeda, window.open sesudahnya
    // biasanya diblokir browser).
    const paymentWindow=window.open('about:blank','_blank');
    paymentController=new AbortController();const timeout=setTimeout(()=>paymentController.abort(),25000);
    try{
      const data=await api('/api/checkout',{customer,items:items()},paymentController.signal);
      const url=new URL(data.redirectUrl);if(url.protocol!=='https:'||!/^checkout(-staging)?\.xendit\.co$/.test(url.hostname))throw Error(t('checkout.invalidPaymentUrl'));
      cart.length=0;renderCart();
      const popupBlocked=!paymentWindow||paymentWindow.closed;
      if(!popupBlocked) paymentWindow.location.href=url.href;
      closeCheckout();
      openPaymentModal(data.orderId,url.href,popupBlocked);
    }catch(error){
      paymentWindow?.close();
      payStatus.textContent=error.name==='AbortError'?t('checkout.timeout'):error.message;
    }
    finally{clearTimeout(timeout);paying=false;qsa('input,textarea,button',form).forEach(el=>el.disabled=false);payButton.disabled=false;}
  });

  // --- Modal status pembayaran: stepper (Dibuat -> Pembayaran -> Diproses ->
  // Selesai) + menunggu / diproses / selesai / gagal. Barang fisik, jadi
  // "Diproses" dicapai begitu lunas (toko masih menyiapkan/mengirim barang);
  // "Selesai" baru aktif kalau admin sudah tandai pesanan selesai — status itu
  // dicek lewat halaman Pesanan Saya, bukan ditunggu live di modal ini.
  const PAYMENT_METHOD_LABELS={qris:'checkout.paymentQris',va:'checkout.paymentVa',ewallet:'checkout.paymentEwallet',card:'checkout.paymentCard'};
  const STEP_CONFIG={
    pending:{doneUpTo:0,current:1,failedAt:-1},
    processing:{doneUpTo:1,current:2,failedAt:-1},
    completed:{doneUpTo:3,current:-1,failedAt:-1},
    failed:{doneUpTo:0,current:-1,failedAt:1},
  };
  function stepsHtml(state){
    const labels=[t('payment.stepCreated'),t('payment.stepPayment'),t('payment.stepProcessing'),t('payment.stepCompleted')];
    const cfg=STEP_CONFIG[state];
    return `<ol class="payment-steps">${labels.map((label,i)=>{
      let cls='';
      if(i===cfg.failedAt)cls='is-failed';
      else if(i<=cfg.doneUpTo)cls='is-done';
      else if(i===cfg.current)cls='is-current';
      const dot=cls==='is-done'?'✓':cls==='is-failed'?'!':String(i+1);
      return `<li class="payment-step ${cls}"><span class="payment-step-dot">${dot}</span><span class="payment-step-label">${esc(label)}</span></li>`;
    }).join('')}</ol>`;
  }
  function orderDetailsHtml(order){
    const itemsHtml=order.items.map(i=>`<li><span>${esc(i.productName)}${i.variantLabel?` (${esc(i.variantLabel)})`:''} × ${i.quantity}</span><strong>${rupiah.format(i.unitPrice*i.quantity)}</strong></li>`).join('');
    const methodKey=PAYMENT_METHOD_LABELS[order.paymentMethod];
    return `<div class="payment-receipt">
      <p class="payment-receipt-row"><span>${esc(t('payment.orderIdLabel'))}</span><strong>${esc(order.id)}</strong></p>
      <p class="payment-receipt-row"><span>${esc(t('payment.date'))}</span><strong>${esc(order.createdAt)}</strong></p>
      <p class="payment-receipt-row"><span>${esc(t('payment.paymentMethod'))}</span><strong>${methodKey?esc(t(methodKey)):esc(order.paymentMethod)}</strong></p>
      <ul class="payment-receipt-items">${itemsHtml}</ul>
      <p class="payment-receipt-row"><span>${esc(t('checkout.subtotal'))}</span><strong>${rupiah.format(order.subtotal)}</strong></p>
      <p class="payment-receipt-row"><span>${esc(t('checkout.shipping'))}</span><strong>${rupiah.format(order.shippingFee)}</strong></p>
      <p class="payment-receipt-row"><span>${esc(t('checkout.paymentFee'))}</span><strong>${rupiah.format(order.paymentFee)}</strong></p>
      <p class="payment-receipt-row payment-receipt-total"><span>${esc(t('checkout.total'))}</span><strong>${rupiah.format(order.total)}</strong></p>
    </div>`;
  }
  const paymentModal=document.createElement('div');
  paymentModal.className='payment-modal';paymentModal.hidden=true;
  paymentModal.innerHTML=`<div class="payment-modal-backdrop"></div><div class="payment-modal-card" role="dialog" aria-modal="true"><button type="button" class="payment-modal-close" aria-label="${esc(t('payment.close'))}">×</button><div class="payment-modal-body"></div></div>`;
  document.body.append(paymentModal);
  const paymentModalBody=qs('.payment-modal-body',paymentModal);
  let paymentPollTimer=null,paymentPollAttempts=0;
  const PAYMENT_POLL_INTERVAL=4000,PAYMENT_POLL_MAX_ATTEMPTS=225;
  function closePaymentModal(){
    clearInterval(paymentPollTimer);paymentPollTimer=null;
    paymentModal.hidden=true;document.body.classList.remove('no-scroll');
  }
  qs('.payment-modal-backdrop',paymentModal).addEventListener('click',closePaymentModal);
  qs('.payment-modal-close',paymentModal).addEventListener('click',closePaymentModal);
  function renderPaymentWaiting(orderId,invoiceUrl,popupBlocked){
    paymentModalBody.innerHTML=`
      ${stepsHtml('pending')}
      <h2>${esc(t('payment.waitingTitle'))}</h2>
      <p class="payment-modal-note">${esc(t('payment.waitingBody'))}</p>
      ${popupBlocked?`<p class="payment-modal-warning">${esc(t('payment.popupBlockedBody'))}</p>`:''}
      <a class="button primary payment-modal-open" href="${esc(invoiceUrl)}" target="_blank" rel="noopener">${esc(t('payment.openPaymentPage'))}</a>
      <button type="button" class="payment-modal-check">${esc(t('payment.checkNow'))}</button>
      <p class="payment-modal-pending-note" aria-live="polite"></p>
      <p class="payment-modal-orderid">${esc(t('payment.orderIdLabel'))}: ${esc(orderId)}</p>
    `;
    qs('.payment-modal-check',paymentModalBody).addEventListener('click',()=>pollOrderStatus(orderId,true));
  }
  function renderPaymentProcessing(order){
    clearInterval(paymentPollTimer);paymentPollTimer=null;
    paymentModalBody.innerHTML=`
      ${stepsHtml('processing')}
      <h2>${esc(t('payment.processingTitle'))}</h2>
      <p class="payment-modal-note">${esc(t('payment.processingBody'))}</p>
      ${orderDetailsHtml(order)}
      <a class="button primary" href="/user/dashboard">${esc(t('payment.viewOrders'))}</a>
    `;
  }
  function renderPaymentCompleted(order){
    clearInterval(paymentPollTimer);paymentPollTimer=null;
    paymentModalBody.innerHTML=`
      ${stepsHtml('completed')}
      <h2>${esc(t('payment.completedTitle'))}</h2>
      <p class="payment-modal-note">${esc(t('payment.completedBody'))}</p>
      ${orderDetailsHtml(order)}
      <a class="button primary" href="/user/dashboard">${esc(t('payment.viewOrders'))}</a>
    `;
  }
  function renderPaymentFailed(){
    clearInterval(paymentPollTimer);paymentPollTimer=null;
    paymentModalBody.innerHTML=`
      ${stepsHtml('failed')}
      <h2>${esc(t('payment.failedTitle'))}</h2>
      <p class="payment-modal-note">${esc(t('payment.failedBody'))}</p>
      <button type="button" class="button primary payment-modal-retry">${esc(t('payment.retry'))}</button>
    `;
    // Stok pesanan yang expired/cancelled sudah dikembalikan di server, jadi
    // keranjang sudah kosong (dikosongkan saat order dibuat) — cukup tutup
    // modal dan arahkan balik ke koleksi untuk belanja ulang.
    qs('.payment-modal-retry',paymentModalBody).addEventListener('click',()=>{closePaymentModal();document.getElementById('pilihan')?.scrollIntoView({behavior:'smooth'});});
  }
  async function pollOrderStatus(orderId,manual){
    const noteEl=qs('.payment-modal-pending-note',paymentModalBody);
    if(manual&&noteEl)noteEl.textContent=t('payment.checking');
    try{
      const response=await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
      if(!response.ok){if(manual&&noteEl)noteEl.textContent=t('payment.loadError');return;}
      const order=await response.json();
      if(['paid','shipped'].includes(order.status)){renderPaymentProcessing(order);return;}
      if(order.status==='completed'){renderPaymentCompleted(order);return;}
      if(['expired','cancelled'].includes(order.status)){renderPaymentFailed();return;}
      if(manual&&noteEl)noteEl.textContent=t('payment.stillPending');
    }catch{if(manual&&noteEl)noteEl.textContent=t('payment.loadError');}
  }
  function openPaymentModal(orderId,invoiceUrl,popupBlocked){
    paymentModal.hidden=false;document.body.classList.add('no-scroll');
    renderPaymentWaiting(orderId,invoiceUrl,popupBlocked);
    paymentPollAttempts=0;clearInterval(paymentPollTimer);
    paymentPollTimer=setInterval(()=>{
      paymentPollAttempts++;
      if(paymentPollAttempts>PAYMENT_POLL_MAX_ATTEMPTS){clearInterval(paymentPollTimer);paymentPollTimer=null;return;}
      pollOrderStatus(orderId,false);
    },PAYMENT_POLL_INTERVAL);
    pollOrderStatus(orderId,false);
  }
})();
