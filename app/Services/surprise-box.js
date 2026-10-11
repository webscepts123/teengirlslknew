import { randomUUID } from 'node:crypto';
import { fail, jsonValue, number } from './database.js';

export async function currentSurprise(db) {
  const [row] = await db.query("SELECT id,name,data FROM feature_records WHERE kind='surprise-box' AND status='active' ORDER BY id DESC LIMIT 1");
  if (!row) return null;
  const data = jsonValue(row.data);
  return { id:row.id, name:row.name, points:number(data.price,'Box points',{integer:true,min:1}), description:data.description || 'A little mystery, a lovely surprise.' };
}

export async function surpriseEligibility(db, customer) {
  const box = await currentSurprise(db);
  const [claim] = await db.query('SELECT order_id FROM surprise_claims WHERE customer_id=?',[customer.id]);
  const [balance] = await db.query('SELECT points FROM customers WHERE id=?',[customer.id]);
  const points = Number(balance.points);
  return { box, points, claimed:Boolean(claim), eligible:Boolean(box && !claim && points>=box.points), missingPoints:box?Math.max(0,box.points-points):0 };
}

// Runs inside the checkout transaction. Locking the customer and the permanent
// unique claim prevents double deductions even when two requests arrive together.
export async function claimSurprise(db, customer, record, addressId, paymentMethod) {
  if (paymentMethod !== 'points') fail('Surprise Boxes can only be claimed with points.');
  const current = await currentSurprise(db);
  if (!current || current.id!==record.id || record.status!=='active') fail('This Surprise Box is no longer available.',409);
  const [balance] = await db.query('SELECT points FROM customers WHERE id=? FOR UPDATE',[customer.id]);
  const [claim] = await db.query('SELECT customer_id FROM surprise_claims WHERE customer_id=? FOR UPDATE',[customer.id]);
  if (claim) fail('You have already claimed your Surprise Box. One box is allowed per customer.',409);
  if (Number(balance.points)<current.points) fail(`You need ${current.points} points to claim this box. You have ${balance.points}.`);
  const orderNumber='TG'+randomUUID().replaceAll('-','').slice(0,14).toUpperCase();
  const order = await db.query(`INSERT INTO orders(order_number,customer_id,shipping_address_id,status,total,payment_method,payment_status,placed_at,shipping_total,notes)
    VALUES (?,?,?,'pending',0,'points','Paid',NOW(),0,?)`,[orderNumber,customer.id,addressId,`Special offer: surprise-box #${record.id}; ${current.points} points`]);
  await db.query("INSERT INTO order_items(order_id,product_id,title,variant,unit_price,quantity,image) VALUES (?,NULL,?,'Surprise Box',0,1,NULL)",[order.insertId,current.name]);
  await db.query('INSERT INTO surprise_claims(customer_id,feature_id,order_id,points_used) VALUES (?,?,?,?)',[customer.id,record.id,order.insertId,current.points]);
  await db.query('UPDATE customers SET points=points-? WHERE id=?',[current.points,customer.id]);
  await db.query("INSERT INTO reward_transactions(customer_id,amount,reason,order_id) VALUES (?,?,'Points payment',?)",[customer.id,-current.points,order.insertId]);
  return {message:'Your Surprise Box is claimed! Delivery is free.',orderNumber,total:0,pointsUsed:current.points,remainingPoints:Number(balance.points)-current.points};
}
