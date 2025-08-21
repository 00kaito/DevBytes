# Overview

This is a podcast marketplace application built with a modern full-stack architecture. The platform allows users to browse podcasts by category, purchase them using Stripe payments, and manage their personal library. The application features a Polish language interface and focuses on programming-related content (Java, JavaScript, Azure, Architecture).

# User Preferences

Preferred communication style: Simple, everyday language.
Admin functionality: User requested admin panel for podcast management (December 21, 2024)
Registration system: User requested user registration capability (December 21, 2024)
Individual product pages: User requested individual sales pages for each product with "Kup Teraz" buttons (December 21, 2024)
Rich text editor: User requested TinyMCE or Markdown editor for product descriptions in admin panel (December 21, 2024)

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database ORM**: Drizzle ORM with PostgreSQL (Neon serverless)
- **Authentication**: OpenID Connect (OIDC) with Replit Auth integration
- **Session Management**: Express sessions stored in PostgreSQL with connect-pg-simple
- **File Storage**: Google Cloud Storage with custom ACL (Access Control List) system

## Data Storage
- **Primary Database**: PostgreSQL via Neon serverless connection
- **Schema Design**: 
  - Users table for authentication and profile data
  - Categories and podcasts with relational structure
  - Purchases table linking users to owned podcasts
  - Sessions table for authentication state
- **Migrations**: Drizzle Kit for database schema management

## Authentication & Authorization
- **Authentication Provider**: Replit OIDC with passport.js strategy
- **Session Storage**: PostgreSQL-backed sessions with HTTP-only cookies
- **Authorization**: Role-based access with middleware guards
- **Security**: CSRF protection via session validation and secure cookie configuration
- **Admin Access**: Simple admin panel for podcast management (admin routes: GET/POST/PUT/DELETE /api/admin/podcasts)
- **Registration**: User registration endpoint with basic validation (/api/register)

## External Dependencies

### Payment Processing
- **Stripe**: Payment processing with React Stripe.js components
- **Integration**: Server-side payment intent creation and client-side payment confirmation

### Cloud Storage
- **Google Cloud Storage**: File storage with custom ACL system
- **Replit Integration**: Service account authentication via Replit sidecar
- **File Upload**: Uppy.js file uploader with direct-to-cloud upload

### Development Tools
- **Database**: Neon PostgreSQL serverless database
- **Build System**: Vite with TypeScript compilation and ESBuild for production
- **Code Quality**: TypeScript strict mode with path mapping for clean imports

### UI Libraries
- **Component System**: Radix UI primitives for accessibility
- **Icons**: Lucide React icon library
- **Styling**: Tailwind CSS with PostCSS processing
- **File Upload**: Uppy ecosystem for file management