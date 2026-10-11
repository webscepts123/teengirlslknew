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

Run one seeder with `npx noderyx db:seed --class=02_CatalogSeeder`. With `NODE_ENV=production`
only the superadmin is seeded; demo data is skipped. Other commands: `npx noderyx migrate:status`
and `npx noderyx migrate:rollback`.

The app still reads its in-memory demo data; the controllers are not wired to these tables yet.

Health check: `GET /health`. For deploying to cPanel, see [deployment/README.md](deployment/README.md).
