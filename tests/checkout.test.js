import test from 'node:test';
import assert from 'node:assert/strict';
import {executeCheckout} from '../app/Services/checkout.js';
import {cartItems,saveCartItem} from '../app/Services/cart.js';
import {database,transaction} from '../app/Services/database.js';
import {updateOrder} from '../app/Services/order-status.js';

test('guest carts, delivery quotes, decimal points and retry protection preserve inventory', {skip:process.env.CHECKOUT_DB_TEST!=='1'}, async()=>{
  assert.match(process.env.DB_NAME||'',/test/,'Use a dedicated test database');
  const db=await database(),suffix=Date.now().toString(36),buyers=[];
  let product,delivery;
  try{
    product=(await db.query("INSERT INTO products(sku,title,category,price,stock,is_active,weight_kg,colors,sizes) VALUES (?,'Checkout Test','Checkout Test',1001,5,1,1.6,?,?)",['CHECK-'+suffix,JSON.stringify(['Pink']),JSON.stringify(['S'])])).insertId;
    for(const tag of ['A','B']) buyers.push({id:(await db.query("INSERT INTO customers(code,name,first_name,email,password_hash,points) VALUES (?,'Checkout Test','Checkout',?,'unused',100)",['CHECK-'+suffix+tag,'checkout-'+suffix+tag+'@example.test'])).insertId,tier:'Bronze'});
    const address=(await db.query("INSERT INTO customer_addresses(customer_id,recipient_name,phone,street,city,district) VALUES (?,'Checkout Test','0770000000','Test Street',?,'Test District')",[buyers[0].id,'Testville-'+suffix])).insertId;
    delivery=(await db.query("INSERT INTO feature_records(kind,name,status,data) VALUES ('delivery','Checkout delivery','active',?)",[JSON.stringify({city:'Testville-'+suffix,district:'Test District',charge:200,freeAbove:0,chargePerKg:100})])).insertId;
    const session={};
    await saveCartItem(session,null,{productId:'CHECK-'+suffix,color:'Pink',size:'S',quantity:1});
    assert.equal((await cartItems(session,null))[0].quantity,1);
    assert.equal((await cartItems(session,buyers[0]))[0].quantity,1);
    assert.equal(session.guestCart.length,0);
    const body={addressId:address,paymentMethod:'cod'};
    const quote=await transaction(q=>executeCheckout(q,buyers[0],body,true));
    assert.equal(quote.subtotal,1001);assert.equal(quote.shipping,200);assert.equal(quote.extraWeightCharge,100);assert.equal(quote.codFee,50);assert.equal(quote.total,1351);
    assert.equal((await db.query('SELECT stock FROM products WHERE id=?',[product]))[0].stock,5);
    await assert.rejects(transaction(q=>executeCheckout(q,buyers[1],body,true)),/delivery addresses/);
    await assert.rejects(transaction(q=>executeCheckout(q,buyers[0],{...body,expectedTotal:1})),/Prices have changed/);
    await db.query('UPDATE customers SET points=0 WHERE id=?',[buyers[0].id]);
    await assert.rejects(transaction(q=>executeCheckout(q,buyers[0],{...body,paymentMethod:'points'})),/Insufficient reward points/);
    assert.equal((await cartItems({},buyers[0])).length,1);
    await db.query('UPDATE customers SET points=100 WHERE id=?',[buyers[0].id]);
    const points=await transaction(q=>executeCheckout(q,buyers[0],{...body,paymentMethod:'points'},true));
    assert.equal(points.total,1301);assert.equal(points.pointsRequired,13.01);
    const request={...body,paymentMethod:'points',expectedTotal:1301,requestId:'checkout-'+suffix};
    const results=await Promise.all([transaction(q=>executeCheckout(q,buyers[0],request)),transaction(q=>executeCheckout(q,buyers[0],request))]);
    assert.equal(results[0].orderNumber,results[1].orderNumber);
    assert.equal(Number((await db.query('SELECT points FROM customers WHERE id=?',[buyers[0].id]))[0].points),86.99);
    assert.equal((await db.query('SELECT stock FROM products WHERE id=?',[product]))[0].stock,4);
    assert.equal((await cartItems({},buyers[0])).length,0);
    const orders=await db.query('SELECT * FROM orders WHERE customer_id=?',[buyers[0].id]);assert.equal(orders.length,1);assert.equal(orders[0].payment_status,'Paid');assert.ok(orders[0].shipping_address_snapshot);
    await transaction(q=>updateOrder(q,orders[0].id,{status:'cancelled'}));
    await transaction(q=>updateOrder(q,orders[0].id,{status:'cancelled'}));
    assert.equal(Number((await db.query('SELECT points FROM customers WHERE id=?',[buyers[0].id]))[0].points),100);
    assert.equal((await db.query('SELECT stock FROM products WHERE id=?',[product]))[0].stock,5);
    await saveCartItem({},buyers[0],{productId:'CHECK-'+suffix,color:'Pink',size:'S',quantity:1});
    const bank=await transaction(q=>executeCheckout(q,buyers[0],{...body,paymentMethod:'bank_transfer',requestId:'bank-'+suffix}));
    assert.equal(bank.total,1301);
    const [bankOrder]=await db.query('SELECT payment_status FROM orders WHERE order_number=?',[bank.orderNumber]);assert.equal(bankOrder.payment_status,'Pending');
    assert.equal(Number((await db.query('SELECT points FROM customers WHERE id=?',[buyers[0].id]))[0].points),100);
  }finally{
    for(const buyer of buyers){await db.query('DELETE FROM reward_transactions WHERE customer_id=?',[buyer.id]);await db.query('DELETE FROM orders WHERE customer_id=?',[buyer.id]);await db.query('DELETE FROM customers WHERE id=?',[buyer.id]);}
    if(delivery)await db.query('DELETE FROM feature_records WHERE id=?',[delivery]);
    if(product)await db.query('DELETE FROM products WHERE id=?',[product]);
    await db.close();
  }
});
