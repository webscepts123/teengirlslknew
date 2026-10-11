# teensgirls

Generated with the Noderyx **SaaS product** profile.

## Requirements

- Node.js 20 or newer

- MySQL 8 or MariaDB 10.4+ for the database (see [Database](#database-mysql--mariadb))

## Setup

```powershell
npm install
npm run setup   # creates .env from .env.example and writes a secure APP_KEY
npm run dev     # http://localhost:3000
```

`npm run setup` is safe to run again; it never replaces an existing `APP_KEY`
(replacing it signs out every user).

## Logging in

- **Customer:** http://localhost:3000/login. Use **1-Click Demo Login**, or register an account.
- **SysAdmin:** http://localhost:3000/sysadmin/login. Credentials come from `ADMIN_USER` /
  `ADMIN_PASSWORD` in `.env` (default `admin` / `admin123`, so change them before deploying).

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Serve with file watching and live reload |
| `npm start` | Serve without watching (production) |
| `npm run qa` | Check views, links, and accessibility |
| `npm run locations:refresh` | Refresh registration districts and cities from OpenStreetMap |
| `npm run migrate` / `npm run seed` | Run migrations / seeders (see below) |

## Database (MySQL / MariaDB)

Registration location options are a local OpenStreetMap snapshot in
`public/sri-lanka-locations.js`, shared by the searchable pickers and server
validation. Cities include mapped towns, villages and suburbs within Sri Lanka's
25 district boundaries. Run `npm run locations:refresh` to update the snapshot,
then restart the server and rebuild any deployed assets. Failed or incomplete
downloads preserve the existing file. `OVERPASS_URL` can select a different
Overpass interpreter endpoint. Data is credited to OpenStreetMap contributors
under [ODbL 1.0](https://www.openstreetmap.org/copyright).

Create an empty database named after `DB_NAME` (default `teensgirls`), check the `DB_*`
settings in `.env` (the defaults match XAMPP: `root` with no password), then:

```powershell
npm run migrate   # create the tables
npm run seed      # load demo data; safe to run again
```

| Seeder | What it adds |
| --- | --- |
| `01_AdminUserSeeder` | Superadmin from `ADMIN_USER` / `ADMIN_PASSWORD` / `ADMIN_EMAIL`, plus demo staff without passwords |
| `02_CatalogSeeder` | 10 products and 3 coupons |
| `03_DemoCustomerSeeder` | Nethmi Perera and Kavindi Silva (password `password123`) with addresses, orders and a wishlist |
| `04_AuditLogSeeder` | Sample admin audit log entries |
| `05_FeatureSeeder` | Store settings, categories, and development promotions, auctions, surprise boxes and support examples |
| `06_LegacyCatalogSeeder` | Actual products and category hierarchy from the legacy backup; hides sample catalog records |
| `07_SurpriseBoxSeeder` | Initial published 25-point Surprise Box; preserves admin changes |
| `08_PointsBiddingSeeder` | Initial points bidding round for an imported product; preserves admin changes |
| `09_CheckoutSettingsSeeder` | COD fee, points conversion, payment availability and bank instructions; preserves existing settings |

Run one seeder with `npx noderyx db:seed --class=02_CatalogSeeder`. With `NODE_ENV=production`
the superadmin, store settings and categories are seeded; demo data is skipped. Other commands: `npx noderyx migrate:status`
and `npx noderyx migrate:rollback`.

The storefront and dashboards now use these database tables. Run migrations and seeders
before starting the app. Repeated seeding preserves edited records.

The legacy catalog snapshot is from February 19, 2025: 7 products and 110 categories
including subcategories. All seven original photos were recovered from
`https://teengirls.lk/storage/` and saved locally under `public/images/legacy-catalog`.
Run `node scripts/import-legacy-images.js` to recover missing photos again;
it preserves custom images uploaded through admin. Original image filenames are
retained in `database/data/legacy-catalog.json`. Repeated catalog seeding preserves
admin changes. `node scripts/extract-legacy-catalog.js <legacy-project-path>` regenerates
the snapshot from that project's SQL backup without importing customer data.

Admin forms manage products and variants, categories, coupons, customers, staff,
orders, returns, reviews, support, settings and feature records. Customers can manage
addresses, profiles, wishlists, carts, orders, rewards, referrals and support tickets.
Checkout calculates prices and stock on the server and supports cash on delivery,
bank transfer and points. Reports export CSV.

The separate `/cart` and `/checkout` pages support guest carts that merge after
sign-in, variant quantities, saved/new delivery addresses, coupons and order
confirmation. Checkout applies location delivery charges, whole-kilogram weight
surcharges and the COD fee (default Rs 50). Regular points payments use Rs 100
per point by default and preserve fractional balances. Admin can edit product
weight and checkout settings. Prices, stock, address ownership and coupon limits
are checked inside a transaction; duplicate requests create one order. Orders
retain the delivery address as it was entered at checkout.

Legacy card payment gateways, SMS/OTP and social login, automated courier services,
label printing and automatic payouts still require integration. Delivery and payment
statuses can be managed manually; payout records do not transfer money.

Surprise Boxes follow the legacy rewards flow: the latest published box costs
points only, includes free delivery, has hidden contents and is limited to one
claim per customer. Claims debit points and create a paid order atomically;
the permanent claim prevents repeat purchases. Boxes have no inventory link.
Configure their name, whole-number point cost, description and private packing
reference in admin. The homepage has an interactive gift preview and address
confirmation. Automatic courier booking and claim emails/SMS are not connected.

Bid & Win uses 1 point per click. The round closes when its configured total is
reached; the highest total contributor wins, with first participation breaking ties.
Open-round cancellations refund the customer's contribution within the configured
window (24 hours by default). Winners claim a free product with free delivery within
the configured deadline (24 hours by default). If a prize remains unclaimed, the
next status or bidding request refunds every participant and reopens the round.
Non-winning bids in a successfully claimed round are not refunded. Admin manages
the product SKU, target and windows; rounds with existing bids cannot be edited.
The homepage shows live progress, personal points, cancellation and prize claiming.

Configure `MAIL_DRIVER=smtp` and the mail settings in `.env` for password reset
emails in production. Development mail is printed to the server console.

Run `npm test` for business rule checks. To include the HTTP integration test, set
`FEATURE_TEST_URL` to a separately migrated and seeded test app; it creates orders
and modifies test inventory, so use a test database.
Set `CHECKOUT_DB_TEST=1` and a `DB_NAME` containing `test` to run
`node --env-file=.env --test tests/checkout.test.js` against a separate migrated,
seeded database. This checks guest merging, delivery/COD fees, address isolation,
insufficient funds, fractional points and simultaneous checkout retries.

Health check: `GET /health`. For deploying to cPanel, see [deployment/README.md](deployment/README.md).
