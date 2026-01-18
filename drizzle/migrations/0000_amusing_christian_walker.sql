CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'preparing', 'ready_for_delivery', 'delivered', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'staff', 'partner', 'user');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"category" text,
	"description" text,
	"date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit" text,
	"stock" numeric DEFAULT '0',
	"min_stock" numeric DEFAULT '10',
	"category" text,
	"last_restocked" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"code" text,
	"level" integer DEFAULT 1,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"parent_id" text,
	"partner_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_dishes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"description" text,
	"tags" text[],
	"price" numeric NOT NULL,
	"category_id" text,
	"stock" integer DEFAULT 99,
	"image_url" text,
	"is_available" boolean DEFAULT true,
	"is_recommended" boolean DEFAULT false,
	"partner_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"table_id" text NOT NULL,
	"customer_id" text,
	"items" jsonb DEFAULT '[]',
	"total_amount" numeric DEFAULT '0',
	"status" text DEFAULT 'pending',
	"payment_method" text,
	"payment_proof" text,
	"cash_received" numeric,
	"cash_change" numeric,
	"is_printed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partners" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_name" text,
	"status" text DEFAULT 'active',
	"commission_rate" numeric DEFAULT '0.15',
	"balance" numeric DEFAULT '0',
	"authorized_categories" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"currency" text DEFAULT 'PHP',
	"currency_symbol" text DEFAULT '₱',
	"exchange_rate" numeric DEFAULT '1.0',
	"is_active" boolean DEFAULT true,
	"payment_type" text,
	"sort_order" integer DEFAULT 0,
	"description" text,
	"description_en" text,
	"icon_type" text,
	"wallet_address" text,
	"qr_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'ready',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_config" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"hotel_name" text DEFAULT '江西云厨酒店',
	"version" text DEFAULT '8.8.0',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"image" text,
	"role" text DEFAULT 'user',
	"partner_id" text,
	"module_permissions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'staff',
	"partner_id" text,
	"module_permissions" jsonb,
	"auth_type" text DEFAULT 'credentials',
	"email_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_passkey_bound" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
