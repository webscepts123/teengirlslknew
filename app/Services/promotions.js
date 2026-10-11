import {fail,number,jsonValue} from './database.js';
import {roundMoney} from './pricing.js';
export const promotionFields={percentage:[],combo:['comboProduct1','comboProduct2','comboPrice'],gift:['giftProduct'],buyonefree:['buyFreeProduct1','buyFreeProduct2','buyFreeProduct3','buyPrice'],anythree:['anyProduct1','anyProduct2','anyProduct3','anyProduct4','anyThreePrice'],freeshipping:[]};
export const promotionSkus=d=>[d.productSku,...(promotionFields[d.type]||[]).filter(k=>!k.endsWith('Price')).map(k=>d[k])].filter(Boolean);
export const promotionLive=(d,now=Date.now())=>(!d.startsAt||Date.parse(d.startsAt)<=now)&&(!d.endsAt||Date.parse(d.endsAt)>now);
export async function validatePromotion(data,body,db,kind){
  if(kind==='promotions'){
    data.type=body.type||'percentage';
    if(!Object.hasOwn(promotionFields,data.type))fail('Choose a valid promotion type.');
    if(data.type!=='percentage'){
      if(!data.productSku)fail('Choose the main promotion product.');
      const requiredFields={combo:['comboProduct1','comboProduct2','comboPrice'],gift:['giftProduct'],buyonefree:['buyFreeProduct1','buyPrice'],anythree:['anyProduct1','anyProduct2','anyThreePrice'],freeshipping:[]}[data.type];
      for(const key of requiredFields)if(!data[key])fail('Complete the required products and price for this promotion.');
      for(const key of promotionFields[data.type].filter(k=>k.endsWith('Price')))number(data[key],key,{min:1});
      const selected=promotionSkus(data);if(new Set(selected).size!==selected.length)fail('Promotion products must all be different.');
    }
  }
  const skus=kind==='flash-sale'?[data.productSku]:promotionSkus(data);
  for(const sku of skus){const [p]=await db.query('SELECT id FROM products WHERE sku=? AND is_active=1',[sku]);if(!p)fail('Product '+sku+' is unavailable.');}
  if(!['active','scheduled'].includes(body.status||'active')||!skus.length)return;
  const others=await db.query("SELECT id,kind,name,data FROM feature_records WHERE kind IN ('promotions','flash-sale') AND status IN ('active','scheduled') FOR UPDATE");
  const start=d=>d.startsAt?Date.parse(d.startsAt):-Infinity,end=d=>d.endsAt?Date.parse(d.endsAt):Infinity;
  for(const row of others){if(Number(row.id)===Number(body.id))continue;const d=jsonValue(row.data);if(start(data)>=end(d)||start(d)>=end(data))continue;const used=row.kind==='flash-sale'?[d.productSku]:promotionSkus(d);if(skus.some(s=>used.includes(s)))fail('A selected product is already used by "'+row.name+'". Pause that offer or choose another product.');}
}

// Fixed-price offers apply only when the main product and required partners
// are together in the cart. Gifts use stock like ordinary purchased items.
export function promotionPricing(records,items){
  const products=new Map();for(const i of items){const p=products.get(i.sku)||{quantity:0,price:Number(i.checkoutPrice),flash:false};p.quantity+=i.quantity;p.flash||=Boolean(i.flashId);products.set(i.sku,p);}
  let discount=0,freeShipping=false;const applied=[];
  for(const row of records){const d=jsonValue(row.data);if(!promotionLive(d)||!d.type||d.type==='percentage')continue;
    const main=products.get(d.productSku);if(!main||main.flash)continue;
    let partners=[],price;
    if(d.type==='freeshipping'){freeShipping=true;applied.push(row.id);continue;}
    if(d.type==='combo'){partners=[d.comboProduct1,d.comboProduct2];price=Number(d.comboPrice);}
    if(d.type==='gift'){partners=[d.giftProduct];price=main.price;}
    if(d.type==='buyonefree'){partners=[d.buyFreeProduct1,d.buyFreeProduct2,d.buyFreeProduct3].filter(s=>products.get(s)?.quantity&&!products.get(s).flash).slice(0,1);price=Number(d.buyPrice);}
    if(d.type==='anythree'){partners=[d.anyProduct1,d.anyProduct2,d.anyProduct3,d.anyProduct4].filter(s=>products.get(s)?.quantity&&!products.get(s).flash).slice(0,2);price=Number(d.anyThreePrice);}
    const needed=['combo','anythree'].includes(d.type)?2:1;if(partners.length!==needed||partners.some(s=>!products.get(s)||products.get(s).flash))continue;
    const count=Math.min(main.quantity,...partners.map(s=>products.get(s).quantity));if(!count)continue;
    const nominal=main.price+partners.reduce((sum,s)=>sum+products.get(s).price,0);discount+=Math.max(0,nominal-price)*count;applied.push(row.id);
    main.quantity-=count;for(const s of partners)products.get(s).quantity-=count;
  }
  return {discount:roundMoney(discount),freeShipping,applied};
}
