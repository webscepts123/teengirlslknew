import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const snapshot = new URL('../database/data/legacy-catalog.json', import.meta.url);
const catalog = JSON.parse(await readFile(snapshot, 'utf8'));
const directory = new URL('../public/images/legacy-catalog/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const product of catalog.products) {
  const response = await fetch('https://teengirls.lk/storage/' + product.sourceImage, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Image download failed for ${product.sku}: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1000 || bytes.length > 10 * 1024 * 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff)
    throw new Error(`Invalid JPEG for ${product.sku}`);
  const filename = `${product.legacyId}-${path.parse(product.sourceImage).name}.jpg`;
  await writeFile(new URL(filename, directory), bytes);
  product.image = '/public/images/legacy-catalog/' + filename;
  console.log(`${product.sku}: ${bytes.length} bytes saved`);
}
await writeFile(snapshot, JSON.stringify(catalog, null, 2) + '\n');
try { process.loadEnvFile(); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const { database } = await import('../app/Services/database.js');
const db = await database();
for (const product of catalog.products)
  await db.query(`UPDATE products SET image=? WHERE sku=? AND (image IS NULL OR image='' OR image='/public/images/legacy-catalog/image-unavailable.svg' OR image=?)`, [product.image, product.sku, '/public/images/legacy-catalog/'+product.legacyId+'-'+path.basename(product.sourceImage)]);
console.log('Missing catalog images updated; custom admin images preserved.');
process.exit(0);
