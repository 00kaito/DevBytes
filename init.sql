
-- DevPodcasts Database Initialization Script
-- This script creates all necessary tables and indexes

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Sessions table (required for express-session with connect-pg-simple)
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "sessions" ("expire");

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar UNIQUE NOT NULL,
  "password_hash" varchar NOT NULL,
  "first_name" varchar,
  "last_name" varchar,
  "profile_image_url" varchar,
  "stripe_customer_id" varchar,
  "is_admin" boolean DEFAULT false,
  "is_email_verified" boolean DEFAULT false,
  "email_verification_token" varchar,
  "email_verification_expires" timestamp,
  "password_reset_token" varchar,
  "password_reset_expires" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS "categories" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL UNIQUE,
  "icon" varchar(100),
  "description" text,
  "created_at" timestamp DEFAULT now()
);

-- Podcasts table
CREATE TABLE IF NOT EXISTS "podcasts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(200) NOT NULL,
  "slug" varchar(200) NOT NULL UNIQUE,
  "description" text,
  "duration" integer, -- in minutes
  "price" integer NOT NULL, -- in cents (Polish grosze)
  "category_id" varchar NOT NULL REFERENCES "categories"("id"),
  "audio_object_path" varchar, -- path to audio file in object storage
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS "purchases" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "podcast_id" varchar NOT NULL REFERENCES "podcasts"("id"),
  "stripe_payment_intent_id" varchar,
  "amount" integer NOT NULL, -- amount paid in cents
  "status" varchar(50) NOT NULL DEFAULT 'completed',
  "purchased_at" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories" ("slug");
CREATE INDEX IF NOT EXISTS "idx_podcasts_slug" ON "podcasts" ("slug");
CREATE INDEX IF NOT EXISTS "idx_podcasts_category_id" ON "podcasts" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_podcasts_is_active" ON "podcasts" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_purchases_user_id" ON "purchases" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_purchases_podcast_id" ON "purchases" ("podcast_id");

-- Insert initial categories
INSERT INTO "categories" ("name", "slug", "icon", "description") VALUES
('Java', 'java', '☕', 'Pogłębiona wiedza o języku Java, JVM i frameworkach enterprise'),
('JavaScript', 'javascript', '🟨', 'Nowoczesny JavaScript, Node.js i frameworki frontendowe'),
('Azure', 'azure', '☁️', 'Microsoft Azure - chmura, DevOps i architektura rozproszonych systemów'),
('Architecture', 'architecture', '🏗️', 'Architektura oprogramowania, wzorce projektowe i best practices')
ON CONFLICT ("slug") DO NOTHING;

-- Create admin user (password: admin123)
-- Hash generated with bcrypt, salt rounds: 10
INSERT INTO "users" ("email", "password_hash", "first_name", "last_name", "is_admin", "is_email_verified") VALUES
('admin@devpodcasts.pl', '$2b$10$8K1p/a3Y8/V9s4n2N3p8qOQ8J1F7R9K2L6C5V8X3W2E4T9A6B3M7S', 'Admin', 'DevPodcasts', true, true)
ON CONFLICT ("email") DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'DevPodcasts database initialized successfully!';
    RAISE NOTICE 'Admin user created: admin@devpodcasts.pl / admin123';
END $$;

