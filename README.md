# Enterprise Procurement System - Frontend

A React-based frontend for the Enterprise Procurement System.

## Run locally

```bash
npm install
npm run dev
```

The app expects the Spring Boot API at `http://localhost:8080`. To use another
address, create `.env.local` in this frontend folder:

```text
VITE_API_URL=http://localhost:8080
```

Use `npm run build` to create a production build.

## Implemented flows

- JWT login/logout with employee, manager, admin, and supplier roles
- Product catalogue and purchase-request creation
- Manager and admin request approvals
- Admin CRUD for users, suppliers, products, categories, departments, and approval hierarchy
- Admin payment processing with supplier MPIN verification
- Supplier account setup, order fulfilment milestones, payment/order CSV exports
- User notifications, request export, and authenticated employee order tracking

## Tech Stack

- React
- Vite
- Tailwind CSS
- Axios
- React Router
- Lucide React

## Project Structure

```text
src/
├── api/
├── components/
├── context/
├── pages/
├── App.jsx
├── index.css
└── main.jsx
