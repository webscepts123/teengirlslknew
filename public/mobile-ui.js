// Keep mobile navigation on the same routes as the desktop storefront.
if (document.body.classList.contains('tgl-home')) {
  const mobile=matchMedia('(max-width:680px)');
  const header=document.querySelector('.tgl-header-main');
  const menuButton=document.createElement('button');
  menuButton.type='button';menuButton.className='tgl-mobile-menu-button';menuButton.setAttribute('aria-label','Open navigation menu');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-controls','mobile-shop-menu');
  menuButton.innerHTML='<span class="fa-solid fa-bars" aria-hidden="true"></span>';
  header?.prepend(menuButton);
  const drawer=document.createElement('dialog');drawer.id='mobile-shop-menu';drawer.className='tgl-mobile-menu';drawer.setAttribute('aria-labelledby','mobile-menu-title');
  drawer.innerHTML='<div class="tgl-mobile-menu-top"><a href="/" aria-label="Teengirls home"><img src="/public/images/brand/teengirls-logo-wide.png" alt="Teengirls.lk" width="108" height="60"></a><button type="button" data-menu-close aria-label="Close navigation menu"><span class="fa-solid fa-xmark" aria-hidden="true"></span></button></div><h2 id="mobile-menu-title">Find your next favourite</h2><p class="tgl-mobile-menu-intro">A little style, a little you.</p><nav class="tgl-mobile-menu-links" aria-label="Shop menu"></nav><details class="tgl-mobile-category-group" open><summary>Browse categories <span class="fa-solid fa-chevron-down" aria-hidden="true"></span></summary><label class="tgl-mobile-category-search">Search categories<input type="search" placeholder="Find a category..." aria-label="Search categories"></label><div class="tgl-mobile-category-links"></div><p data-category-empty hidden>No matching categories.</p></details><div class="tgl-mobile-menu-account"><a href="/customer/dashboard"><span class="fa-regular fa-user" aria-hidden="true"></span> My account</a><a href="/track-order"><span class="fa-solid fa-truck-fast" aria-hidden="true"></span> Track my order</a></div>';
  const mainLinks=[['/shop','New arrivals','fa-sparkles'],['/flash-sale','Sale & deals','fa-tag'],['/offers','Offers','fa-gift'],['/surprise-boxes','Surprise boxes','fa-box-open'],['/auctions','Bid & win','fa-gavel']];
  for(const [href,label,icon] of mainLinks){const a=document.createElement('a');a.href=href;const symbol=document.createElement('span');symbol.className='fa-solid '+(icon==='fa-sparkles'?'fa-star':icon);symbol.setAttribute('aria-hidden','true');a.append(symbol,document.createTextNode(label));drawer.querySelector('.tgl-mobile-menu-links').append(a);}
  for(const link of document.querySelectorAll('.tgl-cat-dropdown a'))drawer.querySelector('.tgl-mobile-category-links').append(link.cloneNode(true));
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
