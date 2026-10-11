import { readFile } from 'node:fs/promises';

export async function run(db) {
  const catalog = JSON.parse(await readFile(new URL('../data/legacy-catalog.json', import.meta.url), 'utf8'));
  await db.transaction(async connection => {
    const query = async (sql, values=[]) => (await connection.execute(sql,values))[0];
    const ids = new Map();
    for (const [index,c] of catalog.categories.entries()) {
      const parentId = c.parent ? ids.get(c.parent) : null;
      if (c.parent && !parentId) throw new Error(`Missing category parent: ${c.parent}`);
      await query('INSERT INTO categories(name,slug,icon,is_active,display_order,parent_id) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',
        [c.name,c.slug,'fa-bag-shopping',c.active,index+1,parentId]);
      const rows = await query('SELECT id FROM categories WHERE name=?',[c.name]);
      if (!rows.length) throw new Error(`Category slug conflict: ${c.name}`);
      ids.set(c.key,rows[0].id);
    }
    for(const p of catalog.products) {
      await query(`INSERT INTO products(sku,title,category,price,original_price,stock,image,colors,sizes,is_active,description,referral_level_1,referral_level_2,referral_level_3)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id`,
        [p.sku,p.title,p.category,p.price,p.originalPrice,p.stock,p.image,JSON.stringify(p.colors),JSON.stringify(p.sizes),p.active,p.description,...p.referralLevels]);
      if (p.image && !p.image.endsWith('image-unavailable.svg'))
        await query("UPDATE products SET image=? WHERE sku=? AND (image IS NULL OR image='' OR image='/public/images/legacy-catalog/image-unavailable.svg')", [p.image,p.sku]);
    }
    // Keep demo records for existing order references, but remove them from shop navigation.
    for(const sku of ['PROD-101','PROD-102','PROD-103','PROD-104','PROD-105','PROD-106','PROD-304','PROD-309','PROD-412','PROD-510'])
      await query('UPDATE products SET is_active=0 WHERE sku=?',[sku]);
    for(const name of ['Dresses','Outerwear & Knits','Bags & Totes','Beauty','Footwear','Jewelry & Accessories','Skirts & Bottoms'])
      await query('UPDATE categories SET is_active=0 WHERE name=?',[name]);
  });
}
