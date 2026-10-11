import bwipjs from 'bwip-js';
import {required,number,jsonValue,fail,money} from './database.js';
import {settingsFor} from './settings.js';
import {normalizeSriLankanPhone} from '../../public/customer-registration-rules.js';
export function shippingAddress(order){
  const snapshot=jsonValue(order.shipping_address_snapshot,null);
  return snapshot||{recipient_name:order.address_recipient||order.customer_name,phone:order.address_phone||order.phone,street:order.address_street||'',city:order.address_city||'',district:order.address_district||'',postal_code:order.address_postal||'',notes:order.address_notes||''};
}
export async function saveShippingDetails(db,order,body){
  if(body.shippingRecipient!==undefined){
    const phone=normalizeSriLankanPhone(body.shippingPhone);if(!phone)fail('Enter a valid Sri Lankan delivery phone number.');
    const address={recipient_name:required(body.shippingRecipient,'Recipient',191),phone,street:required(body.shippingStreet,'Delivery address',255),city:required(body.shippingCity,'City',100),district:required(body.shippingDistrict,'District',100),postal_code:String(body.shippingPostalCode||'').slice(0,20)};
    await db.query('UPDATE orders SET shipping_address_snapshot=? WHERE id=?',[JSON.stringify(address),order.id]);
  }
  if(body.parcelWeight!==undefined||body.packageCount!==undefined||body.deliveryNotes!==undefined){
    const weight=body.parcelWeight===undefined?order.parcel_weight_kg:body.parcelWeight===''?null:number(body.parcelWeight,'Parcel weight',{max:1000});
    const count=body.packageCount===undefined?order.package_count:number(body.packageCount,'Package count',{min:1,max:20,integer:true});
    await db.query('UPDATE orders SET parcel_weight_kg=?,package_count=?,delivery_notes=? WHERE id=?',[weight??null,count||1,String(body.deliveryNotes??order.delivery_notes??'').slice(0,500),order.id]);
  }
}
export function labelBarcode(text){return 'data:image/svg+xml;base64,'+Buffer.from(bwipjs.toSVG({bcid:'code128',text:String(text),height:10,includetext:true,textsize:10,paddingwidth:8,paddingheight:3})).toString('base64');}
export async function labelsFor(db,ids){
  const settings=await settingsFor(db),labels=[];
  for(const id of ids){
    const [o]=await db.query(`SELECT o.*,c.name customer_name,c.phone,a.recipient_name address_recipient,a.phone address_phone,a.street address_street,a.city address_city,a.district address_district,a.postal_code address_postal,a.notes address_notes FROM orders o JOIN customers c ON c.id=o.customer_id LEFT JOIN customer_addresses a ON a.id=o.shipping_address_id WHERE o.id=?`,[id]);
    if(!o)fail('Order not found.',404);
    const address=shippingAddress(o);if(!address.street||!address.phone)fail('Complete the delivery address and phone before creating this label.');
    const items=await db.query('SELECT i.title,i.variant,i.quantity,p.weight_kg FROM order_items i LEFT JOIN products p ON p.id=i.product_id WHERE order_id=?',[id]);
    const weight=o.parcel_weight_kg??items.reduce((sum,i)=>sum+Number(i.weight_kg||0)*i.quantity,0);
    const collect=o.payment_method==='cod'&&!['Paid','Paid on Delivery'].includes(o.payment_status)?Number(o.total):0;
    labels.push({id:o.id,orderNumber:o.order_number,date:new Date(o.placed_at).toLocaleDateString('en-GB'),recipient:address.recipient_name,phone:address.phone,address:[address.street,address.city,address.district,address.postal_code].filter(Boolean).join(', '),courier:o.courier_name||'Courier not assigned',tracking:o.tracking_number||'',orderBarcode:labelBarcode(o.order_number),trackingBarcode:o.tracking_number?labelBarcode(o.tracking_number):'',cod:money(collect),payment:o.payment_method==='cod'?'Cash on delivery':o.payment_status==='Paid'?'Prepaid':'Payment pending',weight:Number(weight).toFixed(2)+' kg',packages:o.package_count||1,items:items.map(i=>({...i,description:[i.title,i.variant].filter(Boolean).join(' / ')})),notes:o.delivery_notes||address.notes||'',senderName:settings.senderName||'Teengirls.lk',senderPhone:settings.senderPhone||'',senderAddress:settings.senderAddress||'',instructions:settings.labelInstructions||'',printed:Boolean(o.label_printed_at),status:o.status});
  }
  return labels;
}
