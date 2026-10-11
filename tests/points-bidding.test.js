import test from 'node:test';
import assert from 'node:assert/strict';
import {placePointBid,cancelPointBids,latestBidding} from '../app/Services/points-bidding.js';
import {purchaseSpecial} from '../app/Services/special-order.js';

test('point bids, refunds, winner claims and expiration preserve balances and inventory',{skip:process.env.FEATURE_BID_DB_TEST!=='1'},async()=>{
  assert.match(process.env.DB_NAME||'',/test/,'Use a dedicated test database');
  const {database,transaction}=await import('../app/Services/database.js');const db=await database();
  const suffix=Date.now().toString(36),sku='BID-'+suffix;
  const p=await db.query("INSERT INTO products(sku,title,category,price,stock,is_active) VALUES (?,'Test Bid Prize','Test',500,5,1)",[sku]);
  const buyers=[],addresses=[];let round;
  try{
    for(const tag of ['A','B']){const c=await db.query("INSERT INTO customers(code,name,first_name,email,password_hash,points) VALUES (?,'Bid Test','Bid',?,'unused',10)",['BID-'+suffix+tag,'bid-'+suffix+tag+'@example.test']);buyers.push({id:c.insertId});const a=await db.query("INSERT INTO customer_addresses(customer_id,recipient_name,phone,street,city) VALUES (?,'Bid Test','0770000000','Test Street','Colombo')",[c.insertId]);addresses.push(a.insertId);}
    const base={name:'Test Points Round',productSku:sku,targetBids:3,cancelHours:24,claimHours:24};
    const result=await db.query("INSERT INTO feature_records(kind,name,status,data) VALUES ('bidding','Test Points Round','active',?)",[JSON.stringify(base)]);round=result.insertId;
    await transaction(q=>placePointBid(q,buyers[0],round));await transaction(q=>placePointBid(q,buyers[0],round));
    assert.equal((await db.query('SELECT points FROM customers WHERE id=?',[buyers[0].id]))[0].points,8);
    const cancelled=await transaction(q=>cancelPointBids(q,buyers[0],round));assert.equal(cancelled.round.total,0);assert.equal(cancelled.round.points,10);
    await db.query('UPDATE customers SET points=0 WHERE id=?',[buyers[1].id]);
    await assert.rejects(transaction(q=>placePointBid(q,buyers[1],round)),/at least 1 point/);
    await db.query('UPDATE customers SET points=10 WHERE id=?',[buyers[1].id]);
    await transaction(q=>placePointBid(q,buyers[0],round));await transaction(q=>placePointBid(q,buyers[0],round));
    const closed=await transaction(q=>placePointBid(q,buyers[1],round));assert.equal(closed.round.closed,true);assert.equal(closed.round.total,3);
    await assert.rejects(transaction(q=>placePointBid(q,buyers[0],round)),/ended or is paused/);
    await assert.rejects(transaction(q=>cancelPointBids(q,buyers[0],round)),/cancellation window/);
    await assert.rejects(transaction(q=>purchaseSpecial(q,buyers[1],{featureId:round,addressId:addresses[1]})),/Only the winning customer/);
    const claims=await Promise.allSettled([transaction(q=>purchaseSpecial(q,buyers[0],{featureId:round,addressId:addresses[0]})),transaction(q=>purchaseSpecial(q,buyers[0],{featureId:round,addressId:addresses[0]}))]);assert.equal(claims.filter(r=>r.status==='fulfilled').length,1);
    const [order]=await db.query('SELECT total,shipping_total,payment_status FROM orders WHERE customer_id=?',[buyers[0].id]);assert.equal(Number(order.total),0);assert.equal(Number(order.shipping_total),0);assert.equal(order.payment_status,'Paid');
    assert.equal((await db.query('SELECT stock FROM products WHERE id=?',[p.insertId]))[0].stock,4);
    assert.equal((await db.query('SELECT points FROM customers WHERE id=?',[buyers[0].id]))[0].points,8);
    // New round: equal contributions use first participation as the tie-breaker.
    await db.query('DELETE FROM auction_bids WHERE auction_id=?',[round]);
    await db.query("UPDATE feature_records SET status='active',data=? WHERE id=?",[JSON.stringify({...base,targetBids:2}),round]);
    await transaction(q=>placePointBid(q,buyers[0],round));await transaction(q=>placePointBid(q,buyers[1],round));
    const state=await transaction(q=>latestBidding(q,buyers[0]));assert.equal(state.winner,true);assert.equal(state.highest,1);
    await db.query('UPDATE feature_records SET data=? WHERE id=?',[JSON.stringify({...base,targetBids:2,closedAt:new Date(Date.now()-25*3600000).toISOString()}),round]);
    const reopened=await transaction(q=>latestBidding(q,buyers[0]));assert.equal(reopened.total,0);assert.equal(reopened.closed,false);assert.equal(reopened.points,8);
    assert.equal((await db.query('SELECT points FROM customers WHERE id=?',[buyers[1].id]))[0].points,9);
    assert.equal((await db.query('SELECT stock FROM products WHERE id=?',[p.insertId]))[0].stock,4);
  }finally{
    if(round)await db.query('DELETE FROM feature_records WHERE id=?',[round]);
    for(const buyer of buyers){await db.query('DELETE FROM reward_transactions WHERE customer_id=?',[buyer.id]);await db.query('DELETE FROM orders WHERE customer_id=?',[buyer.id]);await db.query('DELETE FROM customers WHERE id=?',[buyer.id]);}
    await db.query('DELETE FROM products WHERE id=?',[p.insertId]);await db.close();
  }
});
