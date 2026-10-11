import {api,escapeHtml as esc} from './feature-client.js';
const panel=document.querySelector('[data-bidding-panel]');
let state=null,signedIn=false,busy=false;
const format=n=>Number(n||0).toLocaleString('en-LK');
function render(){
  if(!panel)return;
  const body=panel.querySelector('[data-bidding-body]');const empty=panel.querySelector('[data-bidding-empty]');
  body.hidden=!state;empty.hidden=Boolean(state);if(!state){empty.textContent='Our next bidding round is on its way. Check back soon!';return;}
  const img=body.querySelector('img');img.src=state.product?.image||'/public/images/placeholder.svg';img.alt=state.product?.title||'Bidding prize';
  body.querySelector('[data-bid-title]').textContent=state.product?.title||state.name;
  const progress=body.querySelector('[role="progressbar"]');progress.setAttribute('aria-valuemax',state.target);progress.setAttribute('aria-valuenow',state.total);progress.querySelector('span').style.width=Math.min(100,state.total/state.target*100)+'%';
  body.querySelector('[data-bid-progress]').textContent=`${format(state.total)} / ${format(state.target)} bids`;
  body.querySelector('[data-bid-participants]').textContent=`${format(state.participants)} participants · Highest contribution: ${format(state.highest)}`;
  body.querySelector('[data-my-bids]').textContent=signedIn?`Your bids: ${format(state.myBids)} · Points left: ${format(state.points)}`:'Sign in to use your reward points.';
  const button=body.querySelector('[data-place-bid]');button.disabled=busy||Boolean(signedIn&&(state.completed||state.closed||!state.canBid));button.textContent=!signedIn?'Sign in to bid':state.completed?'Prize claimed':state.closed?'Round ended':state.points<1?'No points available':'Bid +1 · Use 1 point';
  body.querySelector('[data-cancel-bids]').hidden=!state.canCancel;body.querySelector('[data-cancel-bids]').disabled=busy;
  const claim=body.querySelector('[data-claim-prize]');claim.hidden=!state.canClaim;claim.disabled=busy;
  body.querySelector('[data-bid-outcome]').textContent=state.completed?'The winner has claimed this prize.':state.closed?(state.winner?'You won! Claim your prize before the deadline.':'The round has ended. The highest contributor wins.'):'Each bid uses 1 point. Highest contributor wins when the target is reached.';
  updateClock();
}
function updateClock(){if(!panel||!state)return;const clock=panel.querySelector('[data-bid-deadline]');if(state.closed&&!state.completed&&state.claimDeadline){const seconds=Math.max(0,Math.floor((Date.parse(state.claimDeadline)-Date.now())/1000));clock.textContent=`Claim window: ${Math.floor(seconds/3600)}h ${Math.floor(seconds%3600/60)}m ${seconds%60}s remaining`;}else clock.textContent=`Winner gets free delivery and pays nothing extra. Claim within ${state.claimHours} hours.`;}
async function refresh(){if(busy)return;try{const data=await api('/api/bidding/status');state=data.round;signedIn=data.signedIn;render();}catch(error){panel.querySelector('[data-bidding-message]').textContent=error.message;}}
function modal(title,content){document.getElementById('bidding-dialog')?.remove();const d=document.createElement('dialog');d.id='bidding-dialog';d.className='tgl-surprise-dialog';d.innerHTML=`<button class="tgl-surprise-close" type="button" aria-label="Close">×</button><h2>${esc(title)}</h2>${content}<p data-bid-modal-message role="status"></p>`;document.body.append(d);d.querySelector('.tgl-surprise-close').onclick=()=>d.close();d.addEventListener('close',()=>d.remove());d.showModal();return d;}
async function submitBid(){
  if(!signedIn){location.href='/customer/login?returnUrl='+encodeURIComponent('/#bid-and-win');return;}
  if(busy||!state?.canBid)return;
  const d=modal('Place a point bid?',`<p>Use 1 reward point to add one bid for <strong>${esc(state.product.title)}</strong>.</p><p>Points are spent when you bid. Highest total contribution wins at ${format(state.target)} bids. In a tie, the earliest participant wins. Non-winning bids are not automatically refunded.</p><p>You can cancel your entire contribution ${state.cancelHours?`within ${state.cancelHours} hours of your first bid`:'while the round is open'}. Cancellation is unavailable once the round ends.</p><button class="tgl-btn tgl-btn-primary" type="button" data-confirm-bid>Confirm · Use 1 point</button>`);
  d.querySelector('[data-confirm-bid]').onclick=async event=>{if(busy)return;busy=true;event.currentTarget.disabled=true;try{const result=await api('/customer/api/bid',{auctionId:state.id});state=result.round;panel.querySelector('[data-bidding-message]').textContent=result.message;d.close();}catch(error){d.querySelector('[data-bid-modal-message]').textContent=error.message;event.currentTarget.disabled=false;}finally{busy=false;render();await refresh();}};
}
async function cancelBids(){
  if(busy||!state?.canCancel)return;
  const d=modal('Cancel your bids?',`<p>Remove your ${format(state.myBids)} bids from this open round and refund ${format(state.myBids)} points.</p><button class="tgl-btn tgl-btn-primary" data-confirm-cancel>Cancel bids & refund points</button>`);
  d.querySelector('[data-confirm-cancel]').onclick=async event=>{busy=true;event.currentTarget.disabled=true;try{const result=await api('/customer/api/bid/cancel',{auctionId:state.id});state=result.round;panel.querySelector('[data-bidding-message]').textContent=result.message;d.close();}catch(error){d.querySelector('[data-bid-modal-message]').textContent=error.message;event.currentTarget.disabled=false;}finally{busy=false;render();await refresh();}};
}
async function claimPrize(){
  if(busy||!state?.canClaim)return;
  const {addresses}=await api('/customer/api/dashboard');
  const d=modal('Your prize is waiting!',`<p>Congratulations! You won ${esc(state.product.title)}. No extra points, cash payment or delivery charge.</p>${addresses.length?`<form><label for="bid-address">Delivery address</label><select name="addressId" id="bid-address" required>${addresses.map(a=>`<option value="${esc(a.id)}">${esc(a.recipientName+', '+a.street+', '+a.city)}</option>`).join('')}</select><button class="tgl-btn tgl-btn-primary tgl-bid-confirm-prize" type="submit">Claim my free prize</button></form>`:'<a class="tgl-btn tgl-btn-primary" href="/customer/addresses">Add a delivery address</a>'}`);
  const form=d.querySelector('form');if(form)form.onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;form.querySelector('button').disabled=true;try{const result=await api('/customer/api/special/purchase',{featureId:state.id,addressId:form.addressId.value,paymentMethod:'points'});form.remove();d.querySelector('[data-bid-modal-message]').innerHTML=`${esc(result.message)}<p>Order ${esc(result.orderNumber)}</p><a class="tgl-btn tgl-btn-primary" href="/customer/orders">View my orders</a>`;}catch(error){d.querySelector('[data-bid-modal-message]').textContent=error.message;form.querySelector('button').disabled=false;}finally{busy=false;await refresh();}};
}
if(panel){
  const report=fn=>()=>Promise.resolve(fn()).catch(e=>panel.querySelector('[data-bidding-message]').textContent=e.message);
  panel.querySelector('[data-place-bid]').onclick=report(submitBid);panel.querySelector('[data-cancel-bids]').onclick=report(cancelBids);panel.querySelector('[data-claim-prize]').onclick=report(claimPrize);
  refresh();setInterval(()=>{if(!document.hidden)refresh();},10000);setInterval(updateClock,1000);
}
