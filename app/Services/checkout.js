import {randomUUID} from 'node:crypto';
import {fail,number,jsonValue} from './database.js';
import {validateVariant,couponDiscount,roundMoney} from './pricing.js';
import {settingsFor} from './settings.js';

export async function executeCheckout(db,customer,b,preview=false) {
        const settings=await settingsFor(db);
        const methods={cod:'codEnabled',bank_transfer:'bankTransferEnabled',points:'pointsEnabled'};
        if(!methods[b.paymentMethod]||Number(settings[methods[b.paymentMethod]]??1)!==1)fail('Choose an available payment method.');

        const [lockedCustomer] = await db.query(
          "SELECT * FROM customers WHERE id=? FOR UPDATE",
          [customer.id],
        );
        const requestId=b.requestId?String(b.requestId):null;
        if(requestId&&!/^[a-zA-Z0-9-]{8,64}$/.test(requestId))fail('Invalid checkout request.');
        if(!preview&&requestId){
          const [previous]=await db.query('SELECT order_number,total FROM orders WHERE customer_id=? AND checkout_request_id=? FOR UPDATE',[customer.id,requestId]);
          if(previous)return {message:'Order already placed.',orderNumber:previous.order_number,total:Number(previous.total)};
        }
        const [address] = await db.query(
          "SELECT * FROM customer_addresses WHERE id=? AND customer_id=?",
          [
            number(String(b.addressId || "").replace("ADDR-", ""), "Address", {
              integer: true,
              min: 1,
            }),
            customer.id,
          ],
        );
        if (!address) fail("Select one of your delivery addresses.");
        const items = await db.query(
          "SELECT c.*,p.sku,p.title,p.price,p.image,p.stock,p.is_active,p.allow_preorder,p.category,p.colors,p.sizes,p.weight_kg FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.customer_id=? ORDER BY p.id FOR UPDATE",
          [customer.id],
        );
        if (!items.length) fail("Your shopping bag is empty.");
        const features = await db.query(
          "SELECT * FROM feature_records WHERE kind IN ('promotions','flash-sale','delivery') AND status='active' FOR UPDATE",
        );
        const totals = new Map();
        for (const item of items)
          totals.set(
            item.product_id,
            (totals.get(item.product_id) || 0) + item.quantity,
          );
        for (const item of items) {
          validateVariant(item, item.color, item.size);
          if (!item.allow_preorder && totals.get(item.product_id) > item.stock)
            fail("Insufficient stock for " + item.title);
        }
        let subtotal = 0;
        const now = Date.now();
        for (const item of items) {
          if (
            !item.is_active ||
            (item.stock < item.quantity && !item.allow_preorder)
          )
            fail(`${item.title} is unavailable.`);
          let price = Number(item.price);
          for (const feature of features) {
            const data = jsonValue(feature.data);
            if (
              feature.kind === "flash-sale" &&
              data.productSku === item.sku &&
              Date.parse(data.startsAt) <= now &&
              Date.parse(data.endsAt) > now &&
              data.quantity >= item.quantity
            ) {
              price = Math.min(price, Number(data.salePrice));
              item.flashId = feature.id;
              item.flashData = {
                ...data,
                quantity: data.quantity - item.quantity,
              };
              feature.data = item.flashData;
            }
          }
          item.checkoutPrice = price;
          subtotal += price * item.quantity;
        }
        subtotal = roundMoney(subtotal);
        let shipping =
          subtotal >= Number(settings.freeShippingAbove ?? 3500)
            ? 0
            : Number(settings.shippingCharge ?? 350);
        const services = features
          .filter((f) => f.kind === "delivery")
          .map((f) => jsonValue(f.data))
          .filter(
            (d) =>
              (!d.district || d.district === address.district) &&
              (!d.city || d.city === address.city),
          );
        services.sort(
          (a, z) =>
            Number(Boolean(z.city)) +
            Number(Boolean(z.district)) -
            (Number(Boolean(a.city)) + Number(Boolean(a.district))),
        );
        if (services[0])
          shipping =
            Number(services[0].freeAbove)>0 && subtotal >= Number(services[0].freeAbove)
              ? 0
              : Number(services[0].charge);
        let discount = 0,
          coupon = null;
        if (b.couponCode) {
          if(items.some(i=>i.flashId))fail('Coupons cannot be combined with flash-sale products.');
          [coupon] = await db.query(
            "SELECT * FROM coupons WHERE code=? FOR UPDATE",
            [String(b.couponCode).toUpperCase()],
          );
          ({ discount, shipping } = couponDiscount(coupon, {
            customerId: customer.id,
            tier: customer.tier,
            subtotal,
            shipping,
          }));
        } else
          for (const feature of features.filter(
            (f) => f.kind === "promotions",
          )) {
            const d = jsonValue(feature.data);
            if (
              Date.parse(d.startsAt) <= now &&
              Date.parse(d.endsAt) > now &&
              subtotal >= d.minSpend
            ) {
              const eligible = items
                .filter((i) => !d.category || i.category === d.category)
                .reduce((sum, i) => sum + i.checkoutPrice * i.quantity, 0);
              discount = Math.max(
                discount,
                (eligible * Number(d.discountPercent)) / 100,
              );
            }
          }
        discount = roundMoney(discount);
        const weight=roundMoney(items.reduce((sum,i)=>sum+Number(i.weight_kg||0)*i.quantity,0));
        const extraWeightCharge=shipping>0?roundMoney(Math.floor(weight)*Number(services[0]?.chargePerKg||0)):0;
        const codFee=b.paymentMethod==='cod'?Number(settings.codFee??50):0;
        const total = roundMoney(subtotal - discount + shipping + extraWeightCharge + codFee);
        const pointValue=number(settings.pointValue??100,'Point value',{min:0.01});
        const points=roundMoney(total/pointValue);
        const quote={subtotal,discount,shipping,extraWeightCharge,codFee,total,pointsRequired:points,pointsAvailable:Number(lockedCustomer.points),weight,
          items:items.map(i=>({id:i.id,title:i.title,quantity:i.quantity,unitPrice:i.checkoutPrice,lineTotal:roundMoney(i.checkoutPrice*i.quantity)})),
          canPayWithPoints:Number(lockedCustomer.points)>=points};
        if (preview) return quote;
        if (b.expectedTotal != null && Number(b.expectedTotal) !== total)
          fail(
            "Prices have changed. Review the updated total before placing the order.",
            409,
          );
        if (b.paymentMethod === "points" && lockedCustomer.points < points)
          fail("Insufficient reward points.");
        const orderNumber = `TG${randomUUID().replace(/-/g, "").slice(0, 14).toUpperCase()}`;
        const result = await db.query(
          "INSERT INTO orders(order_number,customer_id,shipping_address_id,status,total,payment_method,payment_status,placed_at,shipping_total,discount_total,coupon_id,cod_fee,extra_weight_charge,shipping_address_snapshot,checkout_request_id) VALUES (?,?,?,'pending',?,?,?,NOW(),?,?,?,?,?,?,?)",
          [
            orderNumber,
            customer.id,
            address.id,
            total,
            b.paymentMethod,
            b.paymentMethod === "points" ? "Paid" : "Pending",
            shipping,
            discount,
            coupon?.id ?? null,
            codFee,extraWeightCharge,JSON.stringify(address),requestId,
          ],
        );
        for (const item of items) {
          await db.query(
            "INSERT INTO order_items(order_id,product_id,title,variant,unit_price,quantity,image) VALUES (?,?,?,?,?,?,?)",
            [
              result.insertId,
              item.product_id,
              item.title,
              [item.color, item.size].filter(Boolean).join(" / "),
              item.checkoutPrice,
              item.quantity,
              item.image,
            ],
          );
          await db.query(
            "UPDATE products SET stock=GREATEST(0,stock-?) WHERE id=?",
            [item.quantity, item.product_id],
          );
          if (item.flashId)
            await db.query("UPDATE feature_records SET data=? WHERE id=?", [
              JSON.stringify(item.flashData),
              item.flashId,
            ]);
        }
        if (coupon)
          await db.query(
            "UPDATE coupons SET redemption_count=redemption_count+1 WHERE id=?",
            [coupon.id],
          );
        if (b.paymentMethod === "points") {
          await db.query("UPDATE customers SET points=points-? WHERE id=?", [
            points,
            customer.id,
          ]);
          await db.query(
            "INSERT INTO reward_transactions(customer_id,amount,reason,order_id) VALUES (?,?,'Points payment',?)",
            [customer.id, -points, result.insertId],
          );
        }
        await db.query("DELETE FROM cart_items WHERE customer_id=?", [
          customer.id,
        ]);
        return { message: "Order placed.", orderNumber, total,pointsUsed:b.paymentMethod==='points'?points:0 };
}
