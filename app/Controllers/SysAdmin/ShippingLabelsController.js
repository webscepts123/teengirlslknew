import {AppController} from '../AppController.js';
import {database,number,fail,transaction} from '../../Services/database.js';
import {authorizeAdmin} from '../../Services/admin-permissions.js';
import {labelsFor} from '../../Services/shipping-labels.js';
const orderIds=value=>{const ids=[...new Set(String(value||'').split(',').map(id=>number(id,'Order ID',{min:1,integer:true})))];if(ids.length>50)fail('Choose up to 50 orders per print batch.');return ids;};
export class ShippingLabelsController extends AppController{
  async show(){
    let admin;try{admin=await this.adminRecord();}catch(e){if(e.status===401)return this.redirect('/sysadmin/login');throw e;}
    authorizeAdmin(admin,'orders');
    const ids=orderIds(this.query.ids);
    return this.render('sysadmin/shipping-labels',{labels:await labelsFor(await database(),ids),ids:ids.join(','),csrfToken:this.context.csrfToken});
  }
  async markPrinted(){return this.api(async()=>{
    const admin=await this.adminRecord();authorizeAdmin(admin,'orders',true);const ids=orderIds(this.body?.ids);
    await transaction(async db=>{await labelsFor(db,ids);for(const id of ids)await db.query('UPDATE orders SET label_printed_at=NOW() WHERE id=?',[id]);await db.query("INSERT INTO audit_logs(actor,event_type,description,ip_address) VALUES (?,'SHIPPING',?,'internal')",[admin.username,'Shipping labels marked printed for orders '+ids.join(',')]);});
    return {message:'Labels marked as printed.'};
  });}
}
