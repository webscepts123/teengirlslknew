// Initial published offer mirrors the live site's 25-point box. Admin edits are preserved.
export async function run(db) {
  await db.query("UPDATE feature_records SET status='paused' WHERE kind='surprise-box' AND name='Teen Sparkle Box' AND JSON_UNQUOTE(JSON_EXTRACT(data,'$.productSkus'))='PROD-103,PROD-104'");
  const [active] = await db.query("SELECT id FROM feature_records WHERE kind='surprise-box' AND (status='active' OR name='Surprise Box') LIMIT 1");
  if (!active) await db.query("INSERT INTO feature_records(kind,name,status,data) VALUES ('surprise-box','Surprise Box','active',?)",[JSON.stringify({name:'Surprise Box',price:25,product:'',description:'A surprise picked just for you. The contents stay a mystery until delivery.'})]);
}
