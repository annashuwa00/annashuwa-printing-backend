# Annashuwa Printing Solution - Backend API

RESTful API for Annashuwa Printing Solution built with Express.js, PostgreSQL, and JWT authentication.

## Features

- JWT Authentication
- User Management
- Design CRUD Operations
- Order Management
- Service Request System
- Admin Dashboard
- Payment Integration (Paystack, Flutterwave)
- File Upload (Cloudinary)
- Rate Limiting
- Security Headers (Helmet)

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=annashuwa_printing
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRE=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@annashuwa.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Setup

```bash
# Create database
createdb annashuwa_printing

# Run schema
psql -d annashuwa_printing -f src/database/schema.sql
```

## Running the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login/email` | Login with email |
| POST | `/api/auth/login/phone` | Login with phone |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update profile | Yes |
| PUT | `/api/users/password` | Change password | Yes |
| GET | `/api/users/designs` | Get user designs | Yes |
| GET | `/api/users/orders` | Get user orders | Yes |
| GET | `/api/users/service-requests` | Get service requests | Yes |
| GET | `/api/users/notifications` | Get notifications | Yes |
| PUT | `/api/users/notifications/:id/read` | Mark notification read | Yes |

### Designs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/designs` | Create design | Yes |
| GET | `/api/designs/public` | Get public designs | No |
| GET | `/api/designs/:id` | Get design by ID | Yes |
| PUT | `/api/designs/:id` | Update design | Yes |
| DELETE | `/api/designs/:id` | Delete design | Yes |

### Orders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders` | Get user orders | Yes |
| GET | `/api/orders/:id` | Get order by ID | Yes |
| PUT | `/api/orders/:id/status` | Update order status | Yes |

### Services

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/services/request` | Request service | Yes |
| GET | `/api/services/my-requests` | Get user requests | Yes |
| GET | `/api/services/request/:id` | Get request by ID | Yes |
| GET | `/api/services/available` | Get available services | No |

### Admin

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/dashboard` | Get dashboard metrics | Admin |
| GET | `/api/admin/users` | Get all users | Admin |
| GET | `/api/admin/service-requests` | Get all requests | Admin |
| PUT | `/api/admin/service-requests/:id/status` | Update request status | Admin |
| GET | `/api/admin/orders` | Get all orders | Admin |
| GET | `/api/admin/designs` | Get all designs | Admin |
| PUT | `/api/admin/users/:id/status` | Update user status | Admin |

### Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/paystack/initialize` | Initialize Paystack payment | Yes |
| POST | `/api/payments/paystack/verify` | Verify Paystack payment | Yes |
| POST | `/api/payments/flutterwave/initialize` | Initialize Flutterwave payment | Yes |
| POST | `/api/payments/flutterwave/verify` | Verify Flutterwave payment | Yes |
| GET | `/api/payments/history` | Get transaction history | Yes |

### Uploads

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/uploads/single` | Upload single file | Yes |
| POST | `/api/uploads/multiple` | Upload multiple files | Yes |
| DELETE | `/api/uploads/file/:publicId` | Delete file | Yes |

## Database Schema

### Tables

- **users**: User accounts and authentication
- **products**: Available products and services
- **orders**: Customer orders
- **designs**: User-created designs
- **service_requests**: Service booking requests
- **transactions**: Payment transactions
- **notifications**: User notifications

See `src/database/schema.sql` for complete schema.

## Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Helmet security headers
- Input validation with express-validator
- SQL injection prevention (parameterized queries)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

Status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Testing

```bash
npm test
```

## License

Copyright © 2024 Annashuwa Printing Solution
