import {randomUUID} from 'node:crypto';
import {database,transaction,fail,number} from './database.js';
import {validateVariant} from './pricing.js';

export async function cartItems(session,customer) {
  const db=await database();
  if(customer&&session.guestCart?.length){
    await transaction(async q=>{
      await q.query('SELECT id FROM customers WHERE id=? FOR UPDATE',[customer.id]);
      for(const item of session.guestCart){
        const [p]=await q.query('SELECT id FROM products WHERE sku=?',[item.sku]);
        if(p)await q.query(`INSERT INTO cart_items(customer_id,product_id,color,size,quantity) VALUES (?,?,?,?,?)
          ON DUPLICATE KEY UPDATE quantity=LEAST(99,quantity+VALUES(quantity))`,[customer.id,p.id,item.color,item.size,item.quantity]);
      }
    });session.guestCart=[];
  }
  if(customer)return db.query(`SELECT c.*,p.sku,p.title,p.price,p.image,p.stock,p.is_active,p.allow_preorder,p.weight_kg
    FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.customer_id=? ORDER BY c.id`,[customer.id]);
  const rows=[];
  for(const item of session.guestCart||[]){const [p]=await db.query('SELECT * FROM products WHERE sku=?',[item.sku]);if(p)rows.push({...p,...item,product_id:p.id,id:item.id});}
  return rows;
}
export async function saveCartItem(session,customer,body) {
  const [p]=await(await database()).query('SELECT * FROM products WHERE sku=? AND is_active=1',[body.productId]);
  if(!p)fail('Product not found.',404);
  const quantity=number(body.quantity??1,'Quantity',{min:1,max:99,integer:true}),color=String(body.color||''),size=String(body.size||'');
  validateVariant(p,color,size);
  if(p.stock<quantity&&!p.allow_preorder)fail('Insufficient stock.');
  if(!customer){
    session.guestCart??=[];
    const item=session.guestCart.find(i=>i.sku===p.sku&&i.color===color&&i.size===size);
    const next=body.mode==='add'&&item?item.quantity+quantity:quantity;
    if(next>99||(!p.allow_preorder&&next>p.stock))fail('Insufficient stock or quantity limit exceeded.');
    if(item)item.quantity=next;
    else{if(session.guestCart.length>=50)fail('Your cart can contain at most 50 different selections.');session.guestCart.push({id:'GUEST-'+randomUUID(),sku:p.sku,color,size,quantity:next});}
  }else{
    await cartItems(session,customer);
    await transaction(async q=>{
      await q.query('SELECT id FROM customers WHERE id=? FOR UPDATE',[customer.id]);
      const [item]=await q.query('SELECT quantity FROM cart_items WHERE customer_id=? AND product_id=? AND color=? AND size=?',[customer.id,p.id,color,size]);
      const next=body.mode==='add'&&item?item.quantity+quantity:quantity;
      if(next>99||(!p.allow_preorder&&next>p.stock))fail('Insufficient stock or quantity limit exceeded.');
      await q.query(`INSERT INTO cart_items(customer_id,product_id,color,size,quantity) VALUES (?,?,?,?,?)
        ON DUPLICATE KEY UPDATE quantity=VALUES(quantity)`,[customer.id,p.id,color,size,next]);
    });
  }
  return {message:'Shopping cart updated.'};
}
export async function removeCartItem(session,customer,id) {
  if(customer)await(await database()).query('DELETE FROM cart_items WHERE id=? AND customer_id=?',[id,customer.id]);
  else session.guestCart=(session.guestCart||[]).filter(i=>i.id!==id);
  return {message:'Removed from cart.'};
}
