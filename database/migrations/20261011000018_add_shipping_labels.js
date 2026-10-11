export async function up(db){
  await db.query('ALTER TABLE orders ADD parcel_weight_kg DECIMAL(8,2) NULL, ADD package_count INT UNSIGNED NOT NULL DEFAULT 1, ADD delivery_notes VARCHAR(500) NULL, ADD label_printed_at DATETIME NULL');
}
export async function down(db){await db.query('ALTER TABLE orders DROP parcel_weight_kg,DROP package_count,DROP delivery_notes,DROP label_printed_at');}
