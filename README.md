# DevPodcasts - Polish Programming Podcast Marketplace

A modern full-stack marketplace for selling Polish programming audio podcasts, featuring individual sales pages, admin panel with rich text editing, and Stripe payment integration.

## 🚀 Features

- **Polish Language Interface** - Complete Polish UI for programming professionals
- **Individual Product Pages** - Dedicated sales pages for each podcast with clickable cards
- **Rich Text Editor** - TinyMCE integration for creating detailed product descriptions
- **Payment Processing** - Stripe integration with PLN currency support
- **User Authentication** - Secure login with Replit Auth (OpenID Connect)
- **Admin Panel** - Complete CRUD operations for podcast management
- **Categories** - Organized by Java, JavaScript, Azure, and Software Architecture
- **User Library** - Personal collection of purchased podcasts
- **Object Storage** - Cloud file storage for audio content

## 🛠️ Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod validation
- **TinyMCE** for rich text editing

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database (Neon serverless)
- **Drizzle ORM** for database operations
- **Stripe** for payment processing
- **Google Cloud Storage** for file storage
- **Replit Auth** (OpenID Connect) for authentication

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v18 or higher)
2. **PostgreSQL database** - Can be set up through Replit's database service
3. **Stripe account** - For payment processing
4. **TinyMCE API key** - For rich text editing (optional, works in read-only mode without)

## 🔧 Environment Variables

Create or ensure these environment variables are set:

### Required for Authentication
```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_session_secret_key
REPLIT_DOMAINS=your_replit_domain
REPL_ID=your_repl_id
```

### Required for Payments
```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### Optional for Object Storage
```
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your_bucket_id
PRIVATE_OBJECT_DIR=your_private_directory
PUBLIC_OBJECT_SEARCH_PATHS=your_public_paths
```

### Optional for Rich Text Editor
```
VITE_TINYMCE_API_KEY=your_tinymce_api_key
```

## 🚀 Getting Started

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (if using git)
git clone <your-repo-url>
cd devpodcasts

# Install dependencies
npm install
```

### Step 2: Set Up Database

```bash
# Push database schema to your PostgreSQL instance
npm run db:push

# Seed the database with sample Polish podcast data
npm run seed
```

### Step 3: Configure Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_`) to `VITE_STRIPE_PUBLIC_KEY`
3. Copy your **Secret key** (starts with `sk_`) to `STRIPE_SECRET_KEY`

### Step 4: Configure TinyMCE (Optional)

1. Go to [TinyMCE Cloud](https://www.tiny.cloud/)
2. Create a free account and get your API key
3. Set `VITE_TINYMCE_API_KEY` environment variable
4. Without this key, the editor works in read-only mode

### Step 5: Start the Application

```bash
# Start both frontend and backend servers
npm run dev
```

The application will be available at:
- **Frontend**: `http://localhost:5173` (or your Replit URL)
- **Backend API**: `http://localhost:5000/api`

## 📁 Project Structure

```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main application component
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── replitAuth.ts      # Authentication setup
│   ├── objectStorage.ts   # File storage operations
│   └── seed.ts            # Database seeding
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── README.md              # This file
```

## 🎯 Usage Guide

### For End Users

1. **Browse Podcasts**: Visit the landing page to see all available programming podcasts
2. **View Details**: Click any podcast card to see the individual product page
3. **Purchase**: Use the "Kup Teraz" button to buy podcasts with Stripe
4. **Access Library**: After purchase, find your podcasts in "Moja Biblioteka"

### For Administrators

1. **Login**: Use Replit Auth to authenticate
2. **Access Admin Panel**: Navigate to `/admin` after logging in
3. **Manage Podcasts**: Create, edit, or delete podcast entries
4. **Rich Content**: Use TinyMCE editor for detailed product descriptions
5. **Monitor Sales**: View user purchases and manage content

## 🔗 API Endpoints

### Public Endpoints
- `GET /api/categories` - Get all podcast categories
- `GET /api/categories/:slug/podcasts` - Get podcasts by category
- `GET /api/podcasts/:slug` - Get individual podcast details

### Authentication Endpoints
- `GET /api/login` - Start login process
- `GET /api/logout` - Logout user
- `GET /api/auth/user` - Get current user info

### Protected Endpoints
- `GET /api/admin/podcasts` - Get all podcasts (admin)
- `POST /api/admin/podcasts` - Create new podcast (admin)
- `PUT /api/admin/podcasts/:id` - Update podcast (admin)
- `DELETE /api/admin/podcasts/:id` - Delete podcast (admin)
- `GET /api/user/purchases` - Get user's purchased podcasts

### Payment Endpoints
- `POST /api/create-payment-intent` - Create Stripe payment
- `POST /api/purchases` - Complete purchase after payment

## 🛡️ Security Features

- **Session-based Authentication** with PostgreSQL storage
- **CSRF Protection** via secure session validation
- **Input Validation** using Zod schemas
- **SQL Injection Prevention** through Drizzle ORM
- **Secure File Storage** with access control lists

## 📱 Mobile Responsive

The application is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Ensure PostgreSQL service is running
   - Run `npm run db:push` to sync schema

2. **Stripe Payments Not Working**
   - Verify Stripe API keys are correctly set
   - Check if keys match your Stripe account environment (test/live)
   - Ensure webhooks are configured for production

3. **TinyMCE Read-Only Mode**
   - This is normal without an API key
   - Get a free API key from TinyMCE Cloud for full functionality

4. **Authentication Issues**
   - Verify `SESSION_SECRET` is set
   - Check `REPLIT_DOMAINS` and `REPL_ID` variables
   - Clear browser cookies and try again

## 🚀 Deployment

### On Replit
1. The app is ready to deploy on Replit
2. Use the Deploy button in your Repl
3. Configure environment variables in deployment settings

### Manual Deployment
1. Build the frontend: `npm run build`
2. Set up production database
3. Configure production environment variables
4. Deploy to your preferred hosting service

## 📄 License

This project is proprietary software for DevPodcasts marketplace.

## 👥 Support

For technical support or questions about the marketplace, please contact the development team.

---

**Made with ❤️ for Polish developers**