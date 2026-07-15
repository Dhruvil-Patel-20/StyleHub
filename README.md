# StyleHub

A full-stack premium e-commerce fashion platform with multi-role support (client, seller, admin), personalized recommendations, visual analytics dashboards, and automated transactional emails.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite, Axios, Recharts, Stripe.js, React Toastify |
| Backend | Node.js, Express, Supabase JS, JWT, bcryptjs, Multer, PDFKit |
| Payments | Stripe (USD), Razorpay (INR), Cash on Delivery |
| Email | Brevo (`@getbrevo/brevo`) |
| Recommendation | Python, FastAPI, TensorFlow, TensorFlow Recommenders, scikit-learn |
| Database | Supabase (PostgreSQL) |

## Project Structure

```
StyleHub/
├── client/                        # React frontend (Vite, port 3000)
│   └── src/
│       ├── components/
│       │   ├── cart/
│       │   ├── layout/            # Navbar, Footer, BannerSlider, ProtectedRoute
│       │   └── product/           # ProductCard with "Sold by" badges
│       ├── context/               # AuthContext, CartContext
│       ├── pages/
│       │   ├── admin/             # AdminPanelPage, Products, Orders, Banners, Coupons
│       │   ├── SellerDashboardPage.jsx
│       │   └── ...                # Cart, Checkout, Home, Orders, Profile, Wishlist, etc.
│       └── utils/api.js           # Axios client (proxied to :5000)
├── server/                        # Node.js/Express backend (port 5000)
│   ├── config/email.config.js
│   ├── controllers/email.controller.js
│   ├── middleware/auth.js          # JWT protect, admin, seller guards
│   ├── routes/                    # auth, products, orders, cart, payment, recommendations, banners, coupons, users, email
│   ├── services/
│   │   ├── email/                 # Brevo email service
│   │   └── paymentReminder.js
│   ├── templates/emails/          # order-confirmation, shipped, delivered, cancelled, payment-receipt, refund, reset-password, welcome, verify-email, payment-pending
│   ├── utils/                     # invoice.js (PDFKit), email.utils.js, productDisplay.js, returnUtils.js
│   ├── uploads/invoices/          # Generated PDF invoices
│   ├── supabase.js
│   └── index.js → server.js
└── recommandation/                # Python recommendation microservice (port 8000)
    ├── data/interactions.csv
    ├── features/                  # preprocess.py, tf_dataset.py
    ├── generators/                # Synthetic data generators
    ├── models/                    # Two-tower TF model (user + product encoders)
    ├── training/                  # Training pipeline + exporter
    ├── saved_models/recommendation_model.pkl
    ├── app.py                     # FastAPI app
    └── train.py
```

## Setup

### 1. Install dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Environment variables

`server/.env`:
```env
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
BREVO_API_KEY=your_brevo_api_key
FRONTEND_URL=http://localhost:3000
RECOMMENDATION_API_URL=http://127.0.0.1:8000
```

`recommandation/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run backend & frontend

```bash
# Terminal 1 — Server
cd server && npm run dev

# Terminal 2 — Client
cd client && npm start
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

### 4. Run the recommendation service

```bash
cd recommandation
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python train.py              # First-time model training
uvicorn app:app --reload
```

- Health: `http://127.0.0.1:8000/health`
- Recommend: `http://127.0.0.1:8000/recommend/{user_id}`
- Retrain: `POST http://127.0.0.1:8000/train`

## API Routes

### Auth — `/api/auth`
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register (client / seller / admin) |
| POST | `/login` | Login, returns JWT |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Reset password with new value |
| GET | `/profile` | Get own profile (protected) |
| PUT | `/profile` | Update name, email, or password |
| PUT | `/wishlist/:productId` | Toggle product in wishlist |

### Products — `/api/products`
| Method | Route | Description |
|---|---|---|
| GET | `/` | List products (filters: category, subCategory, price, size, color, search, sellerId, inStock, minRating, sort, page, limit) |
| GET | `/featured` | Get featured products |
| GET | `/sellers` | List unique sellers with active products |
| GET | `/myproducts` | Seller: own products with reviews |
| GET | `/:id` | Product detail with seller name & reviews |
| POST | `/` | Seller: create product (multipart, up to 5 images) |
| PUT | `/:id` | Seller/Admin: update product |
| DELETE | `/:id` | Seller/Admin: delete product |
| POST | `/:id/review` | Authenticated: submit review (once per user) |

### Orders — `/api/orders`
| Method | Route | Description |
|---|---|---|
| POST | `/` | Create order (validates coupon, sends confirmation email + invoice) |
| GET | `/myorders` | Client: own orders |
| GET | `/sellerorders` | Seller: orders containing their products |
| GET | `/all` | Admin: all orders |
| GET | `/return-requests` | Admin: pending return requests |
| GET | `/:id` | Order detail |
| POST | `/:id/invoice` | Generate/email PDF invoice |
| PUT | `/:id/pay` | Mark order paid (sends payment receipt + invoice) |
| PUT | `/:id/status` | Admin: update status (triggers shipped/delivered/cancelled emails; auto-marks COD paid on delivery) |
| PUT | `/:id/cancel` | Client: cancel order (if not shipped/delivered) |
| POST | `/:id/return` | Client: request return on delivered order |
| PUT | `/:id/return/:itemIndex/approve` | Admin: approve single item return |
| PUT | `/:id/return/:itemIndex/reject` | Admin: reject single item return |
| PUT | `/:id/return/approve-all` | Admin: approve all return items |
| PUT | `/:id/return/reject-all` | Admin: reject all return items |
| PUT | `/:id/return/refund` | Admin: process refund (restores stock) |
| POST | `/:id/send-email` | Admin: manually trigger order email |
| POST | `/fix-cod-paid` | Admin: backfill unpaid delivered COD orders |

### Payment — `/api/payment`
| Method | Route | Description |
|---|---|---|
| POST | `/create-payment-intent` | Stripe: create PaymentIntent (USD) |
| POST | `/razorpay/create-order` | Razorpay: create order (INR) |

### Coupons — `/api/coupons`
| Method | Route | Description |
|---|---|---|
| GET | `/validate?code=&amount=&deliveryCost=` | Validate coupon & compute discount |
| GET | `/all` | Admin: list all coupons |
| POST | `/` | Admin: create coupon (percent / fixed / free_shipping) |
| PUT | `/:id` | Admin: update coupon |
| PATCH | `/:id/toggle` | Admin: toggle active status |
| DELETE | `/:id` | Admin: delete coupon |

### Users — `/api/users`
| Method | Route | Description |
|---|---|---|
| GET | `/` | Admin: list all users |
| PUT | `/:id/role` | Admin: change user role |
| DELETE | `/:id` | Admin: delete user |
| DELETE | `/me` | Self: delete own account |

### Other
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/banners` | Manage homepage banners |
| GET/POST | `/api/cart` | Shopping cart |
| GET | `/api/recommendations` | Personalized recommendations (proxies to Python service) |

## Frontend Pages

**Public**
- `/` — Home: banner slider, featured & recommended products
- `/products` — Catalog with filters (category, subcategory, size, color, seller, price, rating, stock)
- `/product/:id` — Detail: images, sizes, reviews, related recommendations
- `/cart` — Cart view
- `/login`, `/register` — Auth
- `/shipping`, `/returns`, `/how-to-care`, `/terms`, `/privacy`, `/contact` — Static info pages

**Client (protected)**
- `/checkout` — Stripe / Razorpay / COD checkout with coupon support
- `/orders`, `/orders/:id` — Order history, tracking, invoice download
- `/profile` — Update profile, password, wishlist
- `/wishlist` — Saved products

**Seller (protected)**
- `/seller` — Dashboard: product CRUD, inventory, sales analytics (AreaChart revenue, BarChart delivery, PieChart order status), customer reviews, order tracking

**Admin (protected)**
- `/admin` — Control panel: banners, coupons, full product library, order management, return approvals, refunds, user role management, analytics (ComposedChart sales + orders, PieChart categories, BarChart user roles)

## Key Features

### Coupon Engine
Supports `percent`, `fixed`, and `free_shipping` types with constraints: min order value, date range, max total uses, max per user, one-per-user, first-order-only, and optional free shipping add-on.

### Returns & Refunds
Customers can request returns on delivered orders per item. Admins approve/reject individually or in bulk. Refunds restore product stock automatically.

### PDF Invoices
Generated with PDFKit on order creation and payment. Stored in `server/uploads/invoices/` and emailed to the customer.

### Transactional Emails (Brevo)
Triggered automatically for: welcome, email verification, password reset, order confirmation, shipped, delivered, cancelled, payment receipt, refund processed, payment pending reminder.

### Recommendation Service
TensorFlow two-tower model (user encoder + product encoder) trained on `interactions.csv`. Served via FastAPI. Auto-trains on startup if no saved model exists. Falls back to trending products for guests.

### COD Auto-Pay
When an admin marks a Cash on Delivery order as `delivered`, the order is automatically marked as paid and a payment receipt email is sent.
