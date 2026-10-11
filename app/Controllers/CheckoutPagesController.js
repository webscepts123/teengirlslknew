import {ShopController} from './ShopController.js';
import {database,money} from '../Services/database.js';
import {settingsFor} from '../Services/settings.js';

export class CheckoutPagesController extends ShopController {
  async cartPage(){return this.render('store',await this.layout(await database(),'Shopping Cart',{isCart:true}));}
  async checkoutPage(){
    try{await this.customerRecord();}catch(error){if(error.status===401)return this.redirect('/customer/login?returnUrl=%2Fcheckout');throw error;}
    return this.render('store',await this.layout(await database(),'Checkout',{isCheckout:true}));
  }
  async successPage(){
    let customer;try{customer=await this.customerRecord();}catch(error){if(error.status===401)return this.redirect('/customer/login?returnUrl='+encodeURIComponent(this.context.url?.pathname||'/customer/orders'));throw error;}
    const db=await database();
    const [order]=await db.query('SELECT * FROM orders WHERE order_number=? AND customer_id=?',[this.params.orderNumber,customer.id]);
    if(!order)return this.abort(404,'Order not found');
    const settings=await settingsFor(db);
    const [payment]=await db.query("SELECT amount FROM reward_transactions WHERE order_id=? AND reason='Points payment'",[order.id]);
    return this.render('store',await this.layout(db,'Order Confirmed',{isSuccess:true,confirmation:{orderNumber:order.order_number,total:money(order.total),paymentMethod:order.payment_method==='cod'?'Cash on delivery':order.payment_method==='points'?'Reward points':'Bank transfer',pointsUsed:payment?Math.abs(Number(payment.amount)):0,isBank:order.payment_method==='bank_transfer',bankInstructions:settings.bankInstructions||'Contact the store for bank details.'}}));
  }
}
