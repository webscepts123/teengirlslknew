import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import path from 'node:path';

// Read only catalog tables from the backup; never execute its SQL or import users.
const source = process.argv[2] || 'D:/teensgirlold/teengirlslkcode';
const sql = await readFile(path.join(source, 'db_file/dump-teengirls_db-202502191715.sql'), 'utf8');
function table(name) {
  const definition = sql.match(new RegExp('CREATE TABLE `' + name + '` \\(([\\s\\S]*?)\\) ENGINE='));
  if (!definition) return [];
  const columns = [...definition[1].matchAll(/^\s*`([^`]+)`/gm)].map(m => m[1]);
  const rows = [];
  for (const match of sql.matchAll(new RegExp('INSERT INTO `' + name + '` VALUES ', 'g'))) {
    let i = match.index + match[0].length;
    while (sql[i] === '(') {
      i++;
      const values = [];
      while (true) {
        let value = '';
        if (sql[i] === "'") {
          i++;
          while (i < sql.length) {
            const c = sql[i++];
            if (c === '\\') {
              const next = sql[i++];
              value += ({ n: '\n', r: '\r', t: '\t', '0': '\0', Z: '\x1a' })[next] ?? next;
            } else if (c === "'") {
              if (sql[i] === "'") { value += "'"; i++; } else break;
            } else value += c;
          }
        } else {
          const start = i;
          while (sql[i] !== ',' && sql[i] !== ')' && i < sql.length) i++;
          const raw = sql.slice(start, i).trim();
          value = raw === 'NULL' ? null : Number(raw);
        }
        values.push(value);
        if (sql[i++] === ')') break;
      }
      if (values.length !== columns.length) throw new Error(`Invalid ${name} row: ${values.length}/${columns.length}`);
      rows.push(Object.fromEntries(columns.map((c, index) => [c, values[index]])));
      if (sql[i] === ',') i++; else break;
    }
  }
  return rows;
}
const roots = table('categories');
const subs = table('subcategories');
const children = table('chield_categories');
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const categories = [...roots.map(r => ({key:`root-${r.id}`,name:r.name,slug:slug(r.name),active:Number(r.status)===1,parent:null})),
  ...subs.map(r => ({key:`sub-${r.id}`,name:r.name,slug:slug(r.name),active:Number(r.status)===1,parent:`root-${r.category_id}`})),
  ...children.map(r => ({key:`child-${r.id}`,name:r.name,slug:slug(r.name),active:Number(r.status)===1,parent:`sub-${r.subcategory_id}`}))];
const usedNames = new Set();
for (const c of categories) {
  if (usedNames.has(c.name)) {
    c.name = `${categories.find(p=>p.key===c.parent)?.name} / ${c.name}`;
    c.slug = slug(c.name);
  }
  usedNames.add(c.name);
}
const products = [];
let imagesCopied = 0;
await mkdir('public/images/legacy-catalog', {recursive:true});
for (const r of table('items')) {
  let image = '/public/images/legacy-catalog/image-unavailable.svg';
  if (r.photo) {
    const recovered = path.join('public/images/legacy-catalog', `${r.id}-${path.parse(r.photo).name}.jpg`);
    try { await access(recovered); image='/public/images/legacy-catalog/'+path.basename(recovered); } catch(error) { if(error.code!=='ENOENT') throw error; }
    const candidates = [path.join(source,'public',r.photo),path.join(source,'public/assets/images',r.photo),path.join(source,'storage/app/public',r.photo)];
    for (const file of candidates) {
      try { await access(file); const filename = `${r.id}-${path.basename(file)}`; await copyFile(file,path.join('public/images/legacy-catalog',filename)); image='/public/images/legacy-catalog/'+filename;imagesCopied++;break; } catch(e) {if(e.code!=='ENOENT') throw e;}
    }
  }
  const regular = Number(r.previous_price)||0;
  const discount = Number(r.discount_price)||0;
  products.push({legacyId:r.id,sku:r.sku || `LEGACY-${r.id}`,title:r.name,
    category:(categories.find(c=>c.key===`child-${r.childcategory_id}`)||categories.find(c=>c.key===`sub-${r.subcategory_id}`)||categories.find(c=>c.key===`root-${r.category_id}`))?.name || 'Uncategorized',
    price:discount>0&&discount<regular?discount:regular,originalPrice:discount>0&&discount<regular?regular:null,
    stock:Array.from({length:7},(_,i)=>Math.max(0,Number(r[i===0?'stock':`stock${i+1}`])||0)).reduce((a,b)=>a+b,0),weightKg:Math.max(0,Number(r.weight)||0),
    colors:Array.from({length:7},(_,i)=>r[i===0?'color':`color${i+1}`]).filter(Boolean).map(c=>String(c).replace(/\s+/g,'')),
    sizes:Array.from({length:6},(_,i)=>r[`size${i+1}`]).filter(Boolean),
    active:Number(r.status)===1,image,sourceImage:r.photo,description:String(r.sort_details||'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim(),
    referralLevels:[Number(r.firstlevel)||0,Number(r.secondlevel)||0,Number(r.thridlevel)||0]});
}
await mkdir('database/data',{recursive:true});
await writeFile('database/data/legacy-catalog.json',JSON.stringify({source:'Legacy catalog backup dated 2025-02-19',categories,products},null,2)+'\n');
console.log(JSON.stringify({categories:categories.length,products:products.length,imagesCopied,missingImages:products.filter(p=>p.image.endsWith('.svg')).map(p=>p.sku)}));
