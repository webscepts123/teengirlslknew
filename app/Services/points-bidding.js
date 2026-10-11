import {randomUUID} from 'node:crypto';
import {fail,jsonValue,number} from './database.js';

export async function biddingState(db,record,customer=null) {
  const data=jsonValue(record.data);
  const target=number(data.targetBids,'Bid target',{min:1,integer:true});
  const rows=await db.query(`SELECT customer_id,SUM(amount) amount,MIN(id) first_id,MIN(created_at) first_at
    FROM auction_bids WHERE auction_id=? GROUP BY customer_id ORDER BY amount DESC,first_id`,[record.id]);
  const total=rows.reduce((n,r)=>n+Number(r.amount),0);
  const own=rows.find(r=>r.customer_id===customer?.id);
  const [product]=await db.query('SELECT sku,title,image,stock,is_active FROM products WHERE sku=?',[data.productSku]);
  const closed=total>=target;
  const claimHours=Number(data.claimHours||24),cancelHours=Number(data.cancelHours??24);
  const deadline=data.closedAt?new Date(Date.parse(data.closedAt)+claimHours*3600000).toISOString():null;
  const balance=customer?Number((await db.query('SELECT points FROM customers WHERE id=?',[customer.id]))[0].points):null;
  return {id:record.id,name:record.name,product:product?{sku:product.sku,title:product.title,image:product.image}:null,
    target,total,participants:rows.length,highest:rows.length?Number(rows[0].amount):0,myBids:Number(own?.amount||0),points:balance,
    closed,completed:Boolean(data.orderId),winner:closed&&rows[0]?.customer_id===customer?.id,
    canBid:record.status==='active'&&!closed&&!data.orderId&&Number(balance)>=1&&Boolean(product?.is_active&&product.stock>0),
    canCancel:record.status==='active'&&!closed&&Boolean(own)&&(cancelHours===0||Date.now()-new Date(own.first_at).getTime()<cancelHours*3600000),
    claimDeadline:deadline,claimHours,cancelHours,
    canClaim:closed&&!data.orderId&&rows[0]?.customer_id===customer?.id&&Boolean(product?.is_active&&product.stock>0)&&(!deadline||Date.now()<Date.parse(deadline))};
}

export async function reopenExpired(db,record) {
  const data=jsonValue(record.data);
  if(data.orderId||!data.closedAt||Date.now()<Date.parse(data.closedAt)+Number(data.claimHours||24)*3600000)return;
  const rows=await db.query('SELECT customer_id,SUM(amount) amount FROM auction_bids WHERE auction_id=? GROUP BY customer_id ORDER BY customer_id',[record.id]);
  for(const row of rows) {
    await db.query('UPDATE customers SET points=points+? WHERE id=?',[Number(row.amount),row.customer_id]);
    await db.query("INSERT INTO reward_transactions(customer_id,amount,reason) VALUES (?,?,?)",[row.customer_id,Number(row.amount),`Bid round #${record.id} expired refund`]);
  }
  await db.query('DELETE FROM auction_bids WHERE auction_id=?',[record.id]);
  delete data.closedAt;
  await db.query('UPDATE feature_records SET data=? WHERE id=?',[JSON.stringify(data),record.id]);record.data=data;
}

export async function latestBidding(db,customer=null) {
  const [record]=await db.query("SELECT * FROM feature_records WHERE kind='bidding' AND status IN ('active','completed') ORDER BY id DESC LIMIT 1 FOR UPDATE");
  if(!record||!jsonValue(record.data).targetBids)return null;
  await reopenExpired(db,record);
  return biddingState(db,record,customer);
}

async function lockedRound(db,id) {
  const [record]=await db.query("SELECT * FROM feature_records WHERE id=? AND kind='bidding' FOR UPDATE",[id]);
  if(!record||!jsonValue(record.data).targetBids)fail('Bidding round not found.',404);
  await reopenExpired(db,record);return record;
}
export async function placePointBid(db,customer,id) {
  const record=await lockedRound(db,id);
  const data=jsonValue(record.data);
  const [balance]=await db.query('SELECT points FROM customers WHERE id=? FOR UPDATE',[customer.id]);
  const state=await biddingState(db,record,customer);
  if(record.status!=='active'||state.closed||state.completed)fail('This bidding round has ended or is paused.',409);
  if(Number(balance.points)<1)fail('You need at least 1 point to bid.');
  if(!state.canBid)fail('The bidding product is unavailable.');
  await db.query('INSERT INTO auction_bids(auction_id,customer_id,amount) VALUES (?,?,1)',[record.id,customer.id]);
  await db.query('UPDATE customers SET points=points-1 WHERE id=?',[customer.id]);
  await db.query("INSERT INTO reward_transactions(customer_id,amount,reason) VALUES (?,-1,?)",[customer.id,`Bid round #${record.id}`]);
  if(state.total+1>=state.target) {
    data.closedAt=new Date().toISOString();
    await db.query('UPDATE feature_records SET data=? WHERE id=?',[JSON.stringify(data),record.id]);record.data=data;
  }
  return {message:'Bid placed. 1 point used.',round:await biddingState(db,record,customer)};
}
export async function cancelPointBids(db,customer,id) {
  const record=await lockedRound(db,id);
  await db.query('SELECT points FROM customers WHERE id=? FOR UPDATE',[customer.id]);
  const state=await biddingState(db,record,customer);
  if(!state.canCancel)fail('Bids can only be cancelled during the cancellation window of an open round.',409);
  await db.query('DELETE FROM auction_bids WHERE auction_id=? AND customer_id=?',[record.id,customer.id]);
  await db.query('UPDATE customers SET points=points+? WHERE id=?',[state.myBids,customer.id]);
  await db.query('INSERT INTO reward_transactions(customer_id,amount,reason) VALUES (?,?,?)',[customer.id,state.myBids,`Bid round #${record.id} cancellation refund`]);
  return {message:`${state.myBids} points refunded.`,round:await biddingState(db,record,customer)};
}
export async function claimBiddingPrize(db,customer,record,addressId) {
  await reopenExpired(db,record);
  const state=await biddingState(db,record,customer);
  if(!state.closed)fail('The round has not ended.');
  if(state.completed)fail('This prize has already been claimed.',409);
  if(!state.winner)fail('Only the winning customer can claim this prize.',403);
  if(!state.canClaim)fail('The claim deadline has passed or the prize is unavailable.',409);
  const data=jsonValue(record.data);
  const [product]=await db.query('SELECT * FROM products WHERE sku=? AND is_active=1 FOR UPDATE',[data.productSku]);
  if(!product||product.stock<1)fail('The prize is out of stock.');
  const orderNumber='TG'+randomUUID().replaceAll('-','').slice(0,14).toUpperCase();
  const order=await db.query(`INSERT INTO orders(order_number,customer_id,shipping_address_id,status,total,payment_method,payment_status,placed_at,shipping_total,notes)
    VALUES (?,?,?,'pending',0,'points','Paid',NOW(),0,?)`,[orderNumber,customer.id,addressId,`Special offer: bidding #${record.id}; free prize`]);
  await db.query("INSERT INTO order_items(order_id,product_id,title,variant,unit_price,quantity,image) VALUES (?,?,?,'Bidding prize',0,1,?)",[order.insertId,product.id,product.title,product.image]);
  await db.query('UPDATE products SET stock=stock-1 WHERE id=?',[product.id]);data.orderId=order.insertId;
  await db.query("UPDATE feature_records SET data=?,status='completed' WHERE id=?",[JSON.stringify(data),record.id]);
  return {message:'Your prize is claimed! No extra points or payment. Delivery is free.',orderNumber,total:0};
}
