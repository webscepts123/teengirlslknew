// Keep mobile navigation on the same routes as the desktop storefront.
if (document.body.classList.contains('tgl-home')) {
  const mobile=matchMedia('(max-width:680px)');
  const header=document.querySelector('.tgl-header-main');
  const menuButton=document.createElement('button');
  menuButton.type='button';menuButton.className='tgl-mobile-menu-button';menuButton.setAttribute('aria-label','Open navigation menu');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-controls','mobile-shop-menu');
  menuButton.innerHTML='<span class="fa-solid fa-bars" aria-hidden="true"></span>';
  header?.prepend(menuButton);
  const drawer=document.createElement('dialog');drawer.id='mobile-shop-menu';drawer.className='tgl-mobile-menu';drawer.setAttribute('aria-labelledby','mobile-menu-title');
  drawer.innerHTML='<div class="tgl-mobile-menu-top"><a href="/" aria-label="Teengirls home"><img src="/public/images/brand/teengirls-logo-wide.png" alt="Teengirls.lk" width="108" height="60"></a><button type="button" data-menu-close aria-label="Close navigation menu"><span class="fa-solid fa-xmark" aria-hidden="true"></span></button></div><div class="tgl-mobile-menu-content"><div class="tgl-mobile-menu-welcome"><span class="tgl-mobile-menu-eyebrow">LOOK GOOD. FEEL YOU.</span><h2 id="mobile-menu-title">Your style starts here.</h2><p class="tgl-mobile-menu-intro">Find something that feels like you.</p></div><nav class="tgl-mobile-menu-links" aria-label="Shop menu"></nav><nav class="tgl-mobile-feature-links" aria-label="Rewards and games"></nav><details class="tgl-mobile-category-group" open><summary>Shop by category <span class="fa-solid fa-chevron-down" aria-hidden="true"></span></summary><label class="tgl-mobile-category-search"><span class="fa-solid fa-magnifying-glass" aria-hidden="true"></span><input type="search" placeholder="Find a category..." aria-label="Search categories"></label><div class="tgl-mobile-category-links"></div><p data-category-empty role="status" hidden>No matches yet. Try another category.</p></details><div class="tgl-mobile-menu-account"><a href="/customer/dashboard"><span class="fa-regular fa-user" aria-hidden="true"></span> My account</a><a href="/track-order"><span class="fa-solid fa-truck-fast" aria-hidden="true"></span> Track order</a></div><a class="tgl-mobile-menu-all" href="/shop">Explore the collection <span class="fa-solid fa-arrow-right" aria-hidden="true"></span></a></div>';
  const mainLinks=[['/shop','New arrivals','fa-star'],['/flash-sale','Sale & deals','fa-tag'],['/offers','Offers for you','fa-gift']];
  for(const [href,label,icon] of mainLinks){const a=document.createElement('a');a.href=href;const symbol=document.createElement('span');symbol.className='fa-solid '+icon;symbol.setAttribute('aria-hidden','true');const text=document.createElement('span');text.textContent=label;const arrow=document.createElement('span');arrow.className='fa-solid fa-arrow-right';arrow.setAttribute('aria-hidden','true');a.append(symbol,text,arrow);if(location.pathname===href)a.setAttribute('aria-current','page');drawer.querySelector('.tgl-mobile-menu-links').append(a);}
  for(const [href,label,caption,icon] of [['/surprise-boxes','Surprise box','A little mystery','fa-box-open'],['/auctions','Bid & win','Put your points to play','fa-gavel']]){const a=document.createElement('a');a.href=href;const symbol=document.createElement('span');symbol.className='fa-solid '+icon;symbol.setAttribute('aria-hidden','true');const title=document.createElement('strong');title.textContent=label;const note=document.createElement('small');note.textContent=caption;a.append(symbol,title,note);drawer.querySelector('.tgl-mobile-feature-links').append(a);}
  const categoryIcons={'accessories':'fa-glasses','health and beauty':'fa-spa','jewelry & watches':'fa-gem','bags & shoes':'fa-bag-shopping','woman clothing':'fa-shirt'};
  for(const link of document.querySelectorAll('.tgl-cat-dropdown a')){const a=link.cloneNode(true),text=document.createElement('span');text.textContent=a.textContent;const icon=document.createElement('span');icon.className='fa-solid '+(categoryIcons[a.textContent.trim().toLowerCase()]||'fa-star');icon.setAttribute('aria-hidden','true');const arrow=document.createElement('span');arrow.className='fa-solid fa-chevron-right';arrow.setAttribute('aria-hidden','true');a.replaceChildren(icon,text,arrow);if(location.pathname===new URL(a.href).pathname)a.setAttribute('aria-current','page');drawer.querySelector('.tgl-mobile-category-links').append(a);}
  drawer.querySelector('input').addEventListener('input',event=>{const term=event.target.value.trim().toLowerCase();let count=0;for(const link of drawer.querySelectorAll('.tgl-mobile-category-links a')){link.hidden=!link.textContent.toLowerCase().includes(term);if(!link.hidden)count++;}drawer.querySelector('[data-category-empty]').hidden=count>0;});
  document.body.append(drawer);
  document.body.classList.add('tgl-mobile-enhanced');
  const openMenu=()=>{drawer.showModal();menuButton.setAttribute('aria-expanded','true');document.body.classList.add('tgl-mobile-menu-open');};
  menuButton.addEventListener('click',openMenu);
  drawer.querySelector('[data-menu-close]').addEventListener('click',()=>drawer.close());
  drawer.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();drawer.close();}},true);
  drawer.addEventListener('click',event=>{if(event.target===drawer){const box=drawer.getBoundingClientRect();if(event.clientX>box.right||event.clientX<box.left||event.clientY>box.bottom||event.clientY<box.top)drawer.close();}});
  drawer.addEventListener('close',()=>{menuButton.setAttribute('aria-expanded','false');document.body.classList.remove('tgl-mobile-menu-open');menuButton.focus({preventScroll:true});});
  document.querySelector('[data-cat-toggle]')?.addEventListener('click',event=>{if(mobile.matches){event.preventDefault();event.stopImmediatePropagation();openMenu();}},true);
  mobile.addEventListener('change',()=>{if(!mobile.matches&&drawer.open)drawer.close();});
  const nav=document.createElement('nav');
  nav.className='tgl-mobile-dock';
  nav.setAttribute('aria-label','Mobile navigation');
  const path=location.pathname;
  const links=[['/','Home','fa-house'],['/shop','Shop','fa-magnifying-glass'],['/customer/wishlist','Saved','fa-heart'],['/cart','Cart','fa-bag-shopping'],['/customer/dashboard','Account','fa-user']];
  for(const [href,label,icon] of links) {
    const a=document.createElement('a');a.href=href;
    const selected=href==='/'?path==='/':href==='/shop'?path==='/shop'||path.startsWith('/category/')||path.startsWith('/product/'):href==='/cart'?path==='/cart'||path.startsWith('/checkout'):path===href;
    if(selected)a.setAttribute('aria-current','page');
    const symbol=document.createElement('span');symbol.className='fa-solid '+icon;symbol.setAttribute('aria-hidden','true');
    const text=document.createElement('span');text.textContent=label;a.append(symbol,text);nav.append(a);
  }
  document.body.append(nav);
}
