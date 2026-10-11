import test from 'node:test';
import assert from 'node:assert/strict';
import { currentSurprise, claimSurprise } from '../app/Services/surprise-box.js';
import { purchaseSpecial } from '../app/Services/special-order.js';

test('Surprise Box point cost must be a positive whole number',async()=>{
  for(const price of [0,-1,1.5,'bad'])await assert.rejects(currentSurprise({query:async()=>[{id:1,name:'Box',data:JSON.stringify({price})}]}),/Box points is invalid/);
});
test('Surprise Boxes reject cash payment before debiting points',async()=>{
  await assert.rejects(claimSurprise({}, {id:1},{id:1},1,'cod'),/only be claimed with points/);
});
test('Surprise Box claims are atomic, one per customer, free of shipping and inventory changes', {skip:process.env.FEATURE_DB_TEST!=='1'}, async()=>{
  assert.match(process.env.DB_NAME||'', /test/,'Select a dedicated test database');
  const {database,transaction}=await import('../app/Services/database.js');
  const db=await database();
  const suffix=Date.now().toString(36);
  const record=await db.query("INSERT INTO feature_records(kind,name,status,data) VALUES ('surprise-box','Test Mystery Box','active',?)",[JSON.stringify({price:25,product:'Private packing description',description:'Hidden contents'})]);
  const customer=await db.query("INSERT INTO customers(code,name,first_name,email,password_hash,points) VALUES (?,'Test Claim','Test',?,'unused',100)",['BOX-'+suffix,'box-'+suffix+'@example.test']);
  const address=await db.query("INSERT INTO customer_addresses(customer_id,recipient_name,phone,street,city) VALUES (?,'Test Claim','0770000000','Test Street','Colombo')",[customer.insertId]);
  const buyer={id:customer.insertId};
  const body={featureId:record.insertId,addressId:address.insertId,paymentMethod:'points'};
  try {
    const before=await db.query('SELECT id,stock FROM products ORDER BY id');
    await assert.rejects(transaction(q=>purchaseSpecial(q,buyer,{...body,addressId:999999999})),/delivery addresses/);
    await assert.rejects(transaction(q=>purchaseSpecial(q,buyer,{...body,paymentMethod:'cod'})),/only be claimed with points/);
    await db.query('UPDATE customers SET points=24 WHERE id=?',[buyer.id]);
    await assert.rejects(transaction(q=>purchaseSpecial(q,buyer,body)),/need 25 points/);
    assert.equal((await db.query('SELECT COUNT(*) count FROM surprise_claims WHERE customer_id=?',[buyer.id]))[0].count,0);
    await db.query('UPDATE customers SET points=100 WHERE id=?',[buyer.id]);
    const results=await Promise.allSettled([transaction(q=>purchaseSpecial(q,buyer,body)),transaction(q=>purchaseSpecial(q,buyer,body))]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.match(results.find(r=>r.status==='rejected').reason.message,/already claimed/);
    assert.equal(Number((await db.query('SELECT points FROM customers WHERE id=?',[buyer.id]))[0].points),75);
    const [order]=await db.query('SELECT * FROM orders WHERE customer_id=?',[buyer.id]);
    assert.equal(Number(order.total),0);assert.equal(Number(order.shipping_total),0);assert.equal(order.payment_method,'points');
    const [item]=await db.query('SELECT * FROM order_items WHERE order_id=?',[order.id]);
    assert.equal(item.product_id,null);assert.equal(item.title,'Test Mystery Box');assert.equal(Number(item.unit_price),0);
    assert.deepEqual(await db.query('SELECT id,stock FROM products ORDER BY id'),before);
    await db.query("UPDATE feature_records SET status='paused' WHERE id=?",[record.insertId]);
    await assert.rejects(transaction(q=>purchaseSpecial(q,buyer,body)),/no longer available/);
  } finally {
    await db.query('DELETE FROM surprise_claims WHERE customer_id=?',[buyer.id]);
    await db.query('DELETE FROM reward_transactions WHERE customer_id=?',[buyer.id]);
    await db.query('DELETE FROM orders WHERE customer_id=?',[buyer.id]);
    await db.query('DELETE FROM customers WHERE id=?',[buyer.id]);
    await db.query('DELETE FROM feature_records WHERE id=?',[record.insertId]);
    await db.close();
  }
});
