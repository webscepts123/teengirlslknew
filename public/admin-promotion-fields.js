import {api,escapeHtml as esc} from './feature-client.js';
const groups={percentage:['discountPercent','minSpend','category'],combo:['productSku','comboProduct1','comboProduct2','comboPrice'],gift:['productSku','giftProduct'],buyonefree:['productSku','buyFreeProduct1','buyFreeProduct2','buyFreeProduct3','buyPrice'],anythree:['productSku','anyProduct1','anyProduct2','anyProduct3','anyProduct4','anyThreePrice'],freeshipping:['productSku']};
const optional=new Set(['buyFreeProduct2','buyFreeProduct3','anyProduct3','anyProduct4','category']);
export async function enhancePromotionForm(form,kind,data){
  const submit=form.querySelector('[type=submit]');if(submit)submit.disabled=true;
  try{
    if(kind==='promotions'){
      const input=form.elements.type,select=document.createElement('select');select.name='type';select.className='tgl-select';select.id=input.id;
      select.innerHTML=[['percentage','Percentage campaign'],['combo','Combo pack'],['gift','Free gift'],['buyonefree','Buy one get one free'],['anythree','Any Three'],['freeshipping','Free shipping']].map(([value,label])=>`<option value="${value}">${label}</option>`).join('');select.value=data.type||'percentage';input.replaceWith(select);
      const sync=()=>{const visible=groups[select.value];for(const key of new Set(Object.values(groups).flat())){const field=form.elements[key];if(!field)continue;const show=visible.includes(key);field.closest('.tgl-form-group').hidden=!show;field.disabled=!show;field.required=show&&!optional.has(key)&&!['discountPercent','minSpend'].includes(key);if(key.endsWith('Price'))field.min='1';} };select.addEventListener('change',sync);sync();
    }
    const {records}=await api('/sysadmin/api/records?kind=products');
    const keys=kind==='flash-sale'?['productSku']:['productSku','comboProduct1','comboProduct2','giftProduct','buyFreeProduct1','buyFreeProduct2','buyFreeProduct3','anyProduct1','anyProduct2','anyProduct3','anyProduct4'];
    for(const key of keys){const input=form.elements[key];if(!input)continue;const select=document.createElement('select');select.name=key;select.id=input.id;select.className='tgl-select';select.required=input.required;select.disabled=input.disabled;select.innerHTML='<option value="">Choose a product</option>'+records.filter(p=>p.is_active||p.sku===data[key]).map(p=>`<option value="${esc(p.sku)}" ${!p.is_active?'disabled':''}>${esc(p.title)} / ${esc(p.sku)} / ${p.stock} in stock</option>`).join('');select.value=data[key]||'';input.replaceWith(select);}
    const note=document.createElement('p');note.className='tgl-promotion-form-note';note.textContent=kind==='promotions'?'Select the promotion type to show its product and price fields. Any Three offers the main product plus two choices; optional choices expand the selection. Products cannot overlap another published offer or flash sale.':'Select a product, set its sale price and quantity, then choose the start and end dates. Products in published promotions cannot join a flash sale.';form.querySelector('.tgl-form-grid').after(note);
  }finally{if(submit)submit.disabled=false;}
}
