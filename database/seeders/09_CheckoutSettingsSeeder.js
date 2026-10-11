export async function run(db) {
  for(const [key,value] of Object.entries({codFee:50,pointValue:100,codEnabled:1,bankTransferEnabled:1,pointsEnabled:1,bankInstructions:'Contact the store for bank details. Include your order number as the payment reference.'}))
    await db.query('INSERT IGNORE INTO settings(setting_key,value) VALUES (?,?)',[key,JSON.stringify(value)]);
}
