import { api, escapeHtml as esc } from './feature-client.js';

const panel=document.querySelector('[data-surprise-panel]');
let state=null, busy=false;
const format=n=>Number(n).toLocaleString('en-LK');
async function refresh() {
  if (!panel) return;
  try {
    const response=await fetch('/customer/api/surprise/status');
    if(response.status===401) {state=null;panel.querySelector('[data-surprise-claim]').textContent='Sign in to claim';return;}
    const result=await response.json();
    if(!response.ok) throw new Error(result.error);
    state=result;
    const button=panel.querySelector('[data-surprise-claim]');
    panel.querySelector('[data-surprise-balance]').textContent=state.claimed?'You’ve already claimed your one-time surprise.':`Your balance: ${format(state.points)} points`;
    button.disabled=state.claimed||!state.box;
    button.textContent=state.claimed?'Surprise already claimed':state.eligible?'Claim my surprise':`Earn ${format(state.missingPoints)} more points`;
    if(!state.box)panel.querySelector('[data-surprise-message]').textContent='This offer is no longer available.';
  }catch(error){panel.querySelector('[data-surprise-message]').textContent=error.message;}
}
async function openClaim() {
  if(busy)return;
  busy=true;
  try {
    await refresh();
    if(!state){location.href='/customer/login?returnUrl='+encodeURIComponent('/#surprise-box');return;}
    if(!state.eligible){if(!state.claimed)location.href='/customer/rewards';return;}
    const response=await api('/customer/api/dashboard');
    const addresses=response.addresses;
    document.getElementById('surprise-claim-dialog')?.remove();
    const dialog=document.createElement('dialog');dialog.id='surprise-claim-dialog';dialog.className='tgl-surprise-dialog';
    dialog.innerHTML=`<button class="tgl-surprise-close" type="button" aria-label="Close">×</button><span class="tgl-surprise-tag">YOUR LITTLE MOMENT OF MAGIC</span><h2>Claim ${esc(state.box.name)}</h2><p>Keep the contents a surprise. We’ll send your box to the address you choose.</p><div class="tgl-surprise-summary"><strong>${format(state.box.points)} points</strong><span>Delivery: free · Cash payment: Rs 0</span></div>${addresses.length?`<form><label for="surprise-address">Delivery address</label><select id="surprise-address" name="addressId" required>${addresses.map(a=>`<option value="${esc(a.id)}">${esc(a.label+': '+a.street+', '+a.city)}</option>`).join('')}</select><p class="tgl-surprise-address" data-selected-address></p><p>You’ll have ${format(state.points-state.box.points)} points left. One box per customer.</p><button class="tgl-btn tgl-btn-primary" type="submit">Confirm · ${format(state.box.points)} points</button></form>`:'<p>Add a delivery address to receive your box.</p><a class="tgl-btn tgl-btn-primary" href="/customer/addresses">Add delivery address</a>'}<p data-claim-message role="status"></p>`;
    document.body.append(dialog);dialog.querySelector('.tgl-surprise-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
    const form=dialog.querySelector('form');
    if(form){
      const updateAddress=()=>{const a=addresses.find(a=>a.id===form.addressId.value);dialog.querySelector('[data-selected-address]').textContent=[a.recipientName,a.street,a.city,a.district,a.phone].filter(Boolean).join(' · ');};
      form.addressId.onchange=updateAddress;updateAddress();
      form.onsubmit=async event=>{
        event.preventDefault();const submit=form.querySelector('button');submit.disabled=true;const target=dialog.querySelector('[data-claim-message]');
        try {const result=await api('/customer/api/special/purchase',{featureId:state.box.id,addressId:form.addressId.value,paymentMethod:'points'});form.remove();target.innerHTML=`<strong>Your surprise is on its way!</strong><p>Order ${esc(result.orderNumber)} · ${format(result.pointsUsed)} points used · Free delivery</p><a class="tgl-btn tgl-btn-primary" href="/customer/orders">View my orders</a>`;await refresh();}
        catch(error){target.textContent=error.message;submit.disabled=false;await refresh();}
      };
    }
  }catch(error){panel.querySelector('[data-surprise-message]').textContent=error.message;}
  finally{busy=false;}
}
if(panel){
  panel.querySelector('[data-gift-toggle]').onclick=event=>{
    const button=event.currentTarget;const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));button.classList.toggle('is-open',open);
    panel.querySelector('[data-gift-hint]').textContent=open?'The real surprise stays secret until delivery ♡':'Tap the box for a little magic';
  };
  panel.querySelector('[data-surprise-claim]').onclick=openClaim;
  refresh();
}
