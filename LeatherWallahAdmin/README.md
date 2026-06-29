# FruitSnacks Admin

Admin dashboard for the FruitSnacks e-commerce platform — built as a single-page React application.

## Tech Stack

- **React 18** + **Vite 5**
- **React Router 6** for routing
- **TanStack React Query 5** for server state and caching
- **React Hook Form** for form handling
- **Tailwind CSS 3** with custom color tokens (`tailwind-scrollbar`, `tailwindcss-motion`)
- **Recharts** for analytics charts
- **SweetAlert2** for confirmations, **React Toastify** for notifications
- **React Quill** rich-text editor, **React Select** dropdowns, **Swiper** carousels

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3001
```

Create a `.env` file in the project root:

```env
VITE_API_URL=https://your-backend-host/api/v1
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server on port 3001 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

> No test runner is configured.

## Features

- Dashboard with sales/order analytics
- Product, category (3-level), brand, banner, campaign, coupon, and offer management
- Order management with courier integration (Pathao, Steadfast)
- Customer and admin user management with role-based permissions (~100 permission flags)
- Site settings (title, favicon, SEO defaults, social links, contact info)
- Page-level SEO management with live Google preview
- Profile and password management

## Architecture Notes

- Authentication is cookie-based — backend sets the `fruit_snacks_token` httpOnly cookie. All API calls send `credentials: "include"`.
- Server state is cached via React Query; custom hooks under `src/hooks/` wrap `useQuery`.
- Two global contexts: `AuthProvider` (current admin) and `SettingProvider` (site settings).
- Protected routes use `PrivateRoute`; layout in `src/layout/DashboardLayout.jsx` renders sidebar + topbar.
- Each feature follows the same convention: `src/pages/<Feature>Page/` for pages, `src/components/<Feature>/` for sub-components (tables, modals).

For deeper architectural guidance, see [CLAUDE.md](CLAUDE.md).

## Related Repos

- Backend: [FruitSnacksBackend](https://github.com/SaifullaJubair/FruitSnacksBackend)
- Storefront: [FruitSnacksFrontend](https://github.com/SaifullaJubair/FruitSnacksFrontend)
