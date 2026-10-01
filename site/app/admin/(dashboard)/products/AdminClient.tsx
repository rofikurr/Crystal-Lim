"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string; name: string; description: string; price: number; category: string;
  image: string; images: string[]; url: string; bestSeller: boolean; published: boolean;
  position: number; createdAt: string; updatedAt: string;
};
const empty: Product = { id:"",name:"",description:"",price:0,category:"jewelry",image:"",images:[],url:"",bestSeller:false,published:true,position:0,createdAt:"",updatedAt:"" };
const categories = [
  ["jewelry","Jewelry"],["crystal","Crystals & Chakra Stones"],["sinergi","12 Sinergi Kristal"],
  ["antique","Antique"],["combination","Combination Jewelry"],["loose","Loose Gemstones"],
  ["rough","Rough Stones"],["herkimer","Herkimer Diamond"],
];
const money = new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0});

export default function AdminClient({ canManageProducts }: { canManageProducts: boolean }) {
  const [products,setProducts] = useState<Product[]>([]);
  const [current,setCurrent] = useState<Product>({...empty});
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [filter,setFilter] = useState("all");
  const [query,setQuery] = useState("");
  const [editorOpen,setEditorOpen] = useState(false);
  const [gallery,setGallery] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/products",{cache:"no-store"});
    const data = await response.json() as { error?: string; products: Product[] };
    if (!response.ok) throw Error(data.error || "Katalog gagal dimuat.");
    setProducts(data.products);
  }
  useEffect(()=>{ refresh().catch(error=>setMessage(error.message)).finally(()=>setLoading(false)); },[]);

  function edit(product?: Product) {
    const p = product ? {...product, images:[...product.images]} : {...empty,position:products.length,images:[]};
    setCurrent(p); setGallery((p.images || []).filter(url=>url !== p.image).join("\n"));
    setMessage(""); setEditorOpen(true);
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setCurrent(prev => ({...prev,[key]:value}));
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true); setMessage("Mengunggah foto…");
    try {
      const form = new FormData(); form.append("image",file);
      const response = await fetch("/api/admin/upload",{method:"POST",body:form});
      const data = await response.json() as { error?: string; url: string };
      if (!response.ok) throw Error(data.error || "Foto gagal diunggah.");
      update("image",data.url); setMessage("Foto berhasil diunggah. Simpan produk untuk menampilkannya.");
    } catch(error) { setMessage(error instanceof Error ? error.message : "Foto gagal diunggah."); }
    finally { setBusy(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("Menyimpan produk…");
    try {
      const payload = {...current,images:gallery.split("\n").map(x=>x.trim()).filter(Boolean)};
      const response = await fetch("/api/admin/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      const data = await response.json() as { error?: string; product: Product };
      if (!response.ok) throw Error(data.error || "Produk gagal disimpan.");
      await refresh(); setEditorOpen(false); setMessage(`${data.product.name} berhasil disimpan.`);
    } catch(error) { setMessage(error instanceof Error ? error.message : "Produk gagal disimpan."); }
    finally { setBusy(false); }
  }
  async function remove(product: Product) {
    if (!confirm(`Hapus "${product.name}" dari katalog? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusy(true); setMessage("Menghapus produk…");
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`,{method:"DELETE"});
      const data = await response.json() as { error?: string };
      if (!response.ok) throw Error(data.error || "Produk gagal dihapus.");
      await refresh(); setEditorOpen(false); setMessage("Produk dihapus.");
    } catch(error) { setMessage(error instanceof Error ? error.message : "Produk gagal dihapus."); }
    finally { setBusy(false); }
  }
  async function toggleBest(product: Product) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...product,bestSeller:!product.bestSeller})});
      const data = await response.json() as { error?: string };
      if (!response.ok) throw Error(data.error || "Perubahan gagal disimpan.");
      await refresh(); setMessage(product.bestSeller ? "Label best seller dilepas." : "Produk ditandai best seller.");
    } catch(error) { setMessage(error instanceof Error ? error.message : "Perubahan gagal disimpan."); }
    finally { setBusy(false); }
  }

  const shown = products.filter(product =>
    (filter === "all" || (filter === "best" && product.bestSeller) || (filter === "draft" && !product.published))
    && product.name.toLowerCase().includes(query.toLowerCase()));

  return <div className="admin-content">
      <div className="admin-intro"><div><p>CATALOG MANAGEMENT</p><h1>Kelola produk</h1><span>Ubah katalog yang tampil di preview Crystal Lim.</span></div>{canManageProducts && <button className="admin-primary" type="button" onClick={()=>edit()}>+ Tambah produk</button>}</div>
      <div className="admin-stats"><div><b>{products.length}</b><span>Total produk</span></div><div><b>{products.filter(p=>p.published).length}</b><span>Tampil di toko</span></div><div><b>{products.filter(p=>p.bestSeller).length}</b><span>Best seller</span></div></div>
      {message && <p className="admin-message" role="status">{message}</p>}
      {editorOpen && canManageProducts && <section className="admin-editor" aria-label="Formulir produk"><div className="editor-head"><div><p>PRODUK</p><h2>{current.id ? "Edit produk" : "Tambah produk"}</h2></div><button type="button" onClick={()=>setEditorOpen(false)} aria-label="Tutup formulir">×</button></div>
        <form onSubmit={save}><div className="admin-form-grid">
          <label className="admin-wide">Nama produk<input required maxLength={140} value={current.name} onChange={e=>update("name",e.target.value)} /></label>
          <label>Harga (Rp)<input required min={0} max={1000000000} type="number" value={current.price} onChange={e=>update("price",Number(e.target.value))} /></label>
          <label>Kategori<select value={current.category} onChange={e=>update("category",e.target.value)}>{categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label className="admin-wide">Deskripsi<textarea rows={5} maxLength={3000} value={current.description} onChange={e=>update("description",e.target.value)} /></label>
          <label className="admin-wide">Foto utama<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>upload(e.target.files?.[0])} /><small>JPG, PNG atau WebP, maksimal 5 MB.</small></label>
          <label className="admin-wide">Atau URL foto utama<input required value={current.image} onChange={e=>update("image",e.target.value)} placeholder="https://... atau /media/..." /></label>
          {current.image && <img className="admin-preview" src={current.image} alt="Pratinjau foto produk" />}
          <label className="admin-wide">Foto tambahan (satu URL per baris)<textarea rows={3} value={gallery} onChange={e=>setGallery(e.target.value)} placeholder="https://..." /></label>
          <label className="admin-wide">Link produk asli (opsional)<input type="url" value={current.url} onChange={e=>update("url",e.target.value)} placeholder="https://crystal-lim.com/..." /></label>
          <label>Urutan tampil<input type="number" min={0} max={10000} value={current.position} onChange={e=>update("position",Number(e.target.value))} /></label>
          <div className="admin-checks"><label><input type="checkbox" checked={current.published} onChange={e=>update("published",e.target.checked)} /> Tampilkan di toko</label><label><input type="checkbox" checked={current.bestSeller} onChange={e=>update("bestSeller",e.target.checked)} /> Best seller</label></div>
        </div><div className="editor-actions"><button type="button" onClick={()=>setEditorOpen(false)}>Batal</button><button className="admin-primary" disabled={busy} type="submit">{busy ? "Menunggu…" : "Simpan produk"}</button></div></form></section>}
      <section className="admin-list"><div className="list-head"><div><h2>Daftar produk</h2><p>{shown.length} produk</p></div><input type="search" aria-label="Cari produk" placeholder="Cari produk…" value={query} onChange={e=>setQuery(e.target.value)} /></div><div className="admin-filters"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Semua</button><button className={filter==="best"?"active":""} onClick={()=>setFilter("best")}>Best seller</button><button className={filter==="draft"?"active":""} onClick={()=>setFilter("draft")}>Disembunyikan</button></div>
        {loading ? <p className="admin-empty">Memuat katalog…</p> : shown.length===0 ? <p className="admin-empty">Belum ada produk di tampilan ini.</p> : <div className="admin-rows">{shown.map(product=><article className="admin-row" key={product.id}><img src={product.image} alt="" /><div className="row-info"><h3>{product.name}</h3><p>{money.format(product.price)}</p><div className="row-tags">{product.bestSeller && <span>BEST SELLER</span>}{!product.published && <span>DISEMBUNYIKAN</span>}</div></div>{canManageProducts && <div className="row-actions"><button disabled={busy} type="button" onClick={()=>toggleBest(product)}>{product.bestSeller ? "Lepas best seller" : "Jadikan best seller"}</button><button type="button" onClick={()=>edit(product)}>Edit</button><button disabled={busy} className="delete" type="button" onClick={()=>remove(product)}>Hapus</button></div>}</article>)}</div>}
      </section>
      <p className="admin-footnote">Perubahan hanya berlaku pada preview ini, belum mengubah katalog di crystal-lim.com. Pembayaran masih belum aktif.</p>
    </div>;
}
