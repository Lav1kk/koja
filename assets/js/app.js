// theme
const root = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'dark';
root.setAttribute('data-theme', savedTheme);
function toggleTheme(){
  const cur = root.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
}
function updateThemeIcon(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;
  const cur = root.getAttribute('data-theme');
  btn.textContent = cur === 'dark' ? '☀️' : '🌙';
}
document.addEventListener('DOMContentLoaded', ()=>{
  updateThemeIcon();
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger?.addEventListener('click', ()=> nav.classList.toggle('open'));

  // modal logic
  setupModal();
  // pages
  if(document.getElementById('bestsellers')) renderBestsellers();
  if(document.getElementById('catalogGrid')) renderCatalog();
  if(document.getElementById('productRoot')) renderProduct();
});

function setupModal(){
  const modal = document.getElementById('orderModal');
  if(!modal) return;
  const close = ()=> modal.classList.remove('open');
  modal.querySelector('.modal__overlay')?.addEventListener('click', close);
  modal.querySelector('.modal__close')?.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
  document.querySelectorAll('[data-order]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const name = btn.getAttribute('data-order') || 'Товар';
      openOrderModal(name);
    });
  });
}

function openOrderModal(productName){
  const modal = document.getElementById('orderModal');
  if(!modal) return;
  modal.querySelector('#orderProductName').textContent = productName;
  const text = encodeURIComponent(`Здравствуйте! Хочу заказать: ${productName}. Подскажите по доставке СДЭК.`);
  const tgLink = `https://t.me/MoasSevas?text=${text}`;
  // also support https://t.me/MoasSevas
  const tgBtn = modal.querySelector('#tgBtn');
  if(tgBtn) tgBtn.href = tgLink;
  modal.classList.add('open');
}
window.openOrderModal = openOrderModal;

function formatPrice(p){ return p.toLocaleString('ru-RU') + ' ₽'; }

function cardHTML(p, color='brown'){
  const col = COLOR_MAP[color] || COLOR_MAP.brown;
  return `<article class="card">
    <a href="product.html?id=${p.id}" class="card__img" style="background:${col.bg}">
      <div style="text-align:center; line-height:1.2">
        <div style="font-size:14px; font-weight:700">${p.name}</div>
        <small>${col.label} · ${p.cat}</small>
      </div>
    </a>
    <div class="card__body">
      <div class="card__cat">${p.cat}</div>
      <div class="card__name">${p.name}</div>
      <div class="card__price">${formatPrice(p.price)}</div>
      <div class="card__actions">
        <a href="product.html?id=${p.id}" class="btn btn--ghost btn--sm">Подробнее</a>
        <button class="btn btn--accent btn--sm" data-order="${p.name} (${col.label}) — ${formatPrice(p.price)}">Заказать</button>
      </div>
    </div>
  </article>`;
}

function renderBestsellers(){
  const grid = document.getElementById('bestsellers');
  const ids = ['messenger','passport','cardholder','glasses'];
  const list = ids.map(id=> PRODUCTS.find(p=> p.id===id)).filter(Boolean);
  grid.innerHTML = list.map(p=> cardHTML(p)).join('');
  // rebind order buttons inside grid
  grid.querySelectorAll('[data-order]').forEach(btn=>{
    btn.addEventListener('click', ()=> openOrderModal(btn.getAttribute('data-order')));
  });
}

function renderCatalog(){
  const grid = document.getElementById('catalogGrid');
  const chips = document.querySelectorAll('.chip');
  let activeCat = 'Все';
  function draw(){
    const filtered = activeCat==='Все' ? PRODUCTS : PRODUCTS.filter(p=> p.cat===activeCat);
    grid.innerHTML = filtered.map(p=> cardHTML(p)).join('') || `<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:40px">Товаров в этой категории пока нет</div>`;
    grid.querySelectorAll('[data-order]').forEach(btn=>{
      btn.addEventListener('click', ()=> openOrderModal(btn.getAttribute('data-order')));
    });
  }
  chips.forEach(ch=>{
    ch.addEventListener('click', ()=>{
      chips.forEach(c=> c.classList.remove('active'));
      ch.classList.add('active');
      activeCat = ch.dataset.cat;
      draw();
    });
  });
  draw();
}

function renderProduct(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'messenger';
  const product = PRODUCTS.find(p=> p.id===id) || PRODUCTS[0];
  let color = params.get('color') || product.colors[0];
  if(!product.colors.includes(color)) color = product.colors[0];
  let activeIndex = 0;

  const root = document.getElementById('productRoot');
  const priceEl = ()=> document.getElementById('pPrice');
  const galleryMain = ()=> document.getElementById('gMain');
  const thumbs = ()=> [...document.querySelectorAll('.gallery__thumb')];

  function galleryBg(c, idx){
    const col = COLOR_MAP[c];
    // 3 разных градиента для листания, но в цвете
    const variants = [col.bg, `linear-gradient(135deg, ${col.hex}, #000)`, `linear-gradient(225deg, ${col.hex}, #444)`];
    return variants[idx % variants.length];
  }

  function render(){
    const col = COLOR_MAP[color];
    root.innerHTML = `
    <div class="gallery">
      <div class="gallery__main" id="gMain" style="background:${galleryBg(color, activeIndex)}">
        <button class="gallery__arrow prev" aria-label="prev">‹</button>
        <div style="text-align:center; z-index:1">
          <div style="font-size:22px; font-weight:700">${product.name}</div>
          <div style="font-size:13px; opacity:.9; margin-top:4px">${col.label} · фото ${activeIndex+1}/3</div>
          <div style="font-size:11px; opacity:.7; margin-top:8px">листай фото →</div>
        </div>
        <button class="gallery__arrow next" aria-label="next">›</button>
      </div>
      <div class="gallery__nav" id="gNav">
        ${[0,1,2].map(i=> `<div class="gallery__thumb ${i===activeIndex?'active':''}" data-i="${i}" style="background:${galleryBg(color,i)}"><span>${i+1}</span></div>`).join('')}
      </div>
    </div>
    <div>
      <div style="font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent)">${product.cat}</div>
      <h1 style="font-size:32px; font-weight:400; line-height:1.1; margin:6px 0 8px">${product.name}</h1>
      <div id="pPrice" style="font-size:22px; font-weight:700; margin-bottom:10px">${formatPrice(product.price)}</div>
      <div style="font-size:14px; color:var(--text-muted)">${product.desc}</div>

      <div style="margin-top:16px; font-size:13px; font-weight:700">Цвет: <span id="colorLabel" style="font-weight:400; color:var(--text-muted)">${col.label}</span></div>
      <div class="colors" id="colorPick">
        ${product.colors.map(c=> `<button class="color-btn ${c===color?'active':''}" data-color="${c}" style="background:${COLOR_MAP[c].hex}" aria-label="${COLOR_MAP[c].label}" title="${COLOR_MAP[c].label}"></button>`).join('')}
      </div>

      <button class="btn btn--accent" style="width:100%; padding:14px; font-size:16px" id="orderBtn">Заказать — ${formatPrice(product.price)}</button>
      <div style="font-size:12px; color:var(--text-muted); text-align:center; margin-top:8px">Оплата и доставка обсуждаются в Telegram/по телефону · Доставка СДЭК</div>

      <div class="specs">
        ${Object.entries(product.specs).map(([k,v])=> `<div class="specs__row"><span>${k}</span><span>${v}</span></div>`).join('')}
        <div class="specs__row"><span>Доставка</span><span>СДЭК по РФ</span></div>
        <div class="specs__row"><span>Гарантия</span><span>12 месяцев</span></div>
      </div>

      <div class="reviews">
        <strong style="color:var(--text)">Отзывы</strong><br/>
        Скоро здесь появятся отзывы покупателей. Хочешь оставить первый — напиши в Telegram после покупки.
      </div>
    </div>`;

    // events
    root.querySelectorAll('.color-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        color = btn.dataset.color;
        const url = new URL(location.href);
        url.searchParams.set('color', color);
        history.replaceState(null,'', url.toString());
        document.getElementById('colorLabel').textContent = COLOR_MAP[color].label;
        galleryMain().style.background = galleryBg(color, activeIndex);
        root.querySelectorAll('.color-btn').forEach(b=> b.classList.toggle('active', b.dataset.color===color));
        // update thumbs bg
        thumbs().forEach((t,i)=> t.style.background = galleryBg(color,i));
        updateOrderBtn();
      });
    });

    function updateOrderBtn(){
      const btn = document.getElementById('orderBtn');
      if(btn) btn.textContent = `Заказать — ${formatPrice(product.price)}`;
      btn.onclick = ()=> openOrderModal(`${product.name} (${COLOR_MAP[color].label}) — ${formatPrice(product.price)}`);
    }
    updateOrderBtn();

    root.querySelector('.gallery__arrow.prev').addEventListener('click', ()=>{ activeIndex = (activeIndex+2)%3; syncGallery(); });
    root.querySelector('.gallery__arrow.next').addEventListener('click', ()=>{ activeIndex = (activeIndex+1)%3; syncGallery(); });
    thumbs().forEach(t=> t.addEventListener('click', ()=>{ activeIndex = parseInt(t.dataset.i,10); syncGallery(); }));

    function syncGallery(){
      galleryMain().style.background = galleryBg(color, activeIndex);
      galleryMain().querySelector('div div:nth-child(2)').textContent = `${COLOR_MAP[color].label} · фото ${activeIndex+1}/3`;
      thumbs().forEach((t,i)=> t.classList.toggle('active', i===activeIndex));
    }

    // swipe
    let startX=0;
    const gm = galleryMain();
    gm.addEventListener('touchstart', e=> startX = e.touches[0].clientX, {passive:true});
    gm.addEventListener('touchend', e=>{
      const dx = e.changedTouches[0].clientX - startX;
      if(Math.abs(dx)>40){ activeIndex = dx<0 ? (activeIndex+1)%3 : (activeIndex+2)%3; syncGallery(); }
    });
  }

  render();
}
