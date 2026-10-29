# Mini Market — Admin Panel (Frontend)

React 18 + React Router 6 + Tailwind CSS 3 (Vite), connected to the API (`minimarket-api`) through an httpOnly cookie.

## Running
```bash
# 1) Backend (minimarket-api folder): copy .env.example to .env and fill it in
npm install && npm run dev                      # http://localhost:4000

# 2) Frontend (here)
cp .env.example .env                            # VITE_PROXY_TARGET = backend address
npm install && npm run dev                      # http://localhost:5173
```
Log in with any existing user (the first admin is created from `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the backend `.env`).

| Command | Purpose |
|---|---|
| `npm run dev` | Start development |
| `npm run build` / `npm run preview` | Production build into `dist/` and preview it |
| `npm run format` | Format code with Prettier |

## Settings (`.env` only)
| Variable | Purpose |
|---|---|
| `VITE_PROXY_TARGET` | In development: the backend address that `/api` is proxied to |
| `VITE_API_URL` | Full API address if it lives on another domain (empty = same domain `/api`) |

In production: either a reverse proxy serves the frontend and `/api` on the same domain, or use `VITE_API_URL` and set `CORS_ORIGIN` in the backend.

## Backend integration
- **Cookie:** the token is in an `httpOnly` cookie set by the server; the frontend stores nothing. Every request in `src/lib/api.js` uses `credentials: "include"`.
- **Session:** `src/auth.jsx` asks `/auth/me` on load, and any `401` from the server sends the user back to the login page.
- **Login page:** the shop name comes from `GET /public/shop` (it updates when you change it in settings); the username is typed by the user.
- **Errors:** `ApiError` carries `message`, `status`, `code` and `errors`. Field errors appear under the field itself through `error` in `<Field>`, and general messages appear in the form.

## Roles
- **Admin:** all pages. Adds users, changes their roles and deletes them from the Admin page (can't change or delete themself).
- **Cashier:** Home, Products (view only, without purchase price), Cashier and the "My Account" page.

## What to buy next month? (Analytics page)
The `components/Forecast.jsx` card lists items by **best sellers** with the **suggested quantity**, its cost and priority (Urgent / Soon / Some time left), as a table on large screens and cards on mobile.
- Pick the sales period and the safety stock; the calculation runs on the server (`GET /analytics/forecast`).
- The **"Done"** button opens the quantity dialog with the suggested amount pre-filled (editable); once confirmed it is added to stock and the suggestion disappears. Items with enough stock are hidden but can be shown.

## Structure
```
src/
  main.jsx · App.jsx · Layout.jsx      router, layout and per-page loader
  auth.jsx                             session + RequireAuth / RequireRole
  store.jsx                            products, settings, cart + operations (talk to the API)
  lib/api.js · lib/utils.js · lib/icons.jsx
  components/                          ui (Field, Modal, Loader…) · forms · Filters · Forecast
  pages/                               Login · Home · ProductsPage · CashierPage · Analytics · Admin
```
The rules in `lib/utils.js` (`R`) use the same messages as the backend, so validation runs in the frontend first and then the server has the final say.
