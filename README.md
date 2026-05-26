# TableSite Admin Panel

A modern admin dashboard for managing restaurants, bookings, and users.

## Features

### Roles
- **Admin** — Full access: user management, restaurant oversight, booking management, approve/reject restaurant limit requests
- **Owner** — Manage up to 3 restaurants, handle bookings, request additional restaurant slots

### Pages
| Role | Pages |
|------|-------|
| Admin | Dashboard, Users, Restaurants, Bookings, Requests |
| Owner | Dashboard, My Restaurants, Bookings, My Requests |

## Tech Stack
- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** — styling
- **React Router v6** — routing
- **ahooks** — API request management (useRequest)
- **axios** — HTTP client with interceptors
- **react-hook-form** — form handling & validation
- **react-icons** — icon library
- **dayjs** — date formatting

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Set your API base URL in .env
VITE_API_URL=http://localhost:8000/api/v1

# 4. Start development server
npm run dev

# 5. Build for production
npm run build
```

## API Endpoints Expected

### Auth
- `POST /auth/login` — `{ email, password }` → `{ token, user }`
- `POST /auth/logout`
- `GET /auth/me`

### Admin
- `GET /admin/dashboard/stats`
- `GET/POST/PUT/DELETE /admin/users`
- `GET/PUT/DELETE /admin/restaurants`
- `PATCH /admin/restaurants/:id/status`
- `GET/PUT/DELETE /admin/bookings`
- `GET /admin/restaurant-requests`
- `PUT /admin/restaurant-requests/:id/review`

### Owner
- `GET /owner/dashboard/stats`
- `GET/POST/PUT/DELETE /owner/restaurants`
- `GET/PUT /owner/bookings`
- `GET/POST /owner/restaurant-requests`

## Project Structure
```
src/
├── api/            # axios instance + API modules
├── components/
│   └── common/     # Sidebar, Header, Layout, Table, Modal, etc.
├── context/        # AuthContext (global state)
├── pages/
│   ├── auth/       # Login
│   ├── admin/      # Admin pages
│   └── owner/      # Owner pages
├── routes/         # React Router configuration
└── types/          # TypeScript interfaces
```
