export async function run(db) {
  const [old]=await db.query("SELECT id FROM feature_records WHERE kind='bidding' AND name='Butterfly Necklace Auction' AND status='active' LIMIT 1");
  if(old)await db.query("UPDATE feature_records SET status='paused' WHERE id=?",[old.id]);
  const rows=await db.query("SELECT data FROM feature_records WHERE kind='bidding'");
  if(rows.some(r=> (typeof r.data==='string'?JSON.parse(r.data):r.data).targetBids))return;
  const [product]=await db.query("SELECT sku,title FROM products WHERE sku='TG/F/003' AND is_active=1 AND stock>0");
  if(!product)return;
  await db.query("INSERT INTO feature_records(kind,name,status,data) VALUES ('bidding','Bid & Win','active',?)",[JSON.stringify({name:'Bid & Win',productSku:product.sku,targetBids:100,cancelHours:24,claimHours:24})]);
}
