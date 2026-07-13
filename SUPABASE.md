# ⚡ Supabase Database Setup & Integration Guide

This application features a fully integrated, dual-mode persistence architecture:
1. **Local Mode (Default)**: Out-of-the-box, the app uses a lightweight, self-seeding local JSON flat-file database (`db.json`) for seamless offline operation and immediate development sandbox preview.
2. **Supabase Cloud Mode**: By simply configuring the Supabase environment variables, the backend server dynamically detects the credentials and seamlessly escalates to a live **Supabase PostgreSQL database** for persistent, secure global leaderboards.

---

## 🏗️ Architectural Overview (Zero-Leak Security)

To adhere to strict security best practices, **all direct database connections are handled server-side**. 
- The React client only communicates with the Express backend proxy routes (`/api/*`).
- Sensitive database API keys or service role keys are **never** exposed to the client browser.
- This shields your database from malicious queries, schema discovery, or record tampering.

---

## 🚀 Step-by-Step Provisioning Guide

Follow these steps to connect your own Supabase cloud database:

### 1. Create a Supabase Project
1. Navigate to [Supabase](https://supabase.com/) and sign in.
2. Click **New Project** and select or create an organization.
3. Enter a project name (e.g., `Reaction Speed Trainer`), set a secure database password, and choose your preferred regional cluster.
4. Wait a couple of minutes for the database to provision.

### 2. Set Up the Schema (SQL Editor)
Once your project is ready:
1. In the left navigation menu, click **SQL Editor**.
2. Click **New Query**.
3. Open the file `supabase_schema.sql` located in this project's root folder.
4. Copy its entire contents and paste it into the Supabase SQL editor.
5. Click **Run**.
   - This creates the `scores` table with robust constraints, configures recommended Row Level Security (RLS) policies, and creates secondary performance indexes.

---

## ⚙️ Environment Configuration

To wire up the server to your live Supabase instance:

### Option A: In Google AI Studio Build (Online Sandbox)
1. Open the **Settings** or **Secrets** menu in AI Studio.
2. Add the following environment variables:
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your private `service_role` API key (this has admin bypass capabilities and is safe because it runs entirely on the server-side). Alternatively, you can use the standard `SUPABASE_ANON_KEY`.

### Option B: Local Development
Add the following keys to your local `.env` file in the project root:

```env
# Supabase Integration Credentials
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-super-secret-service-role-key"
```

---

## ⚡ Verification & Dynamic Fallback

You can confirm the system has initialized Supabase correctly by checking the server logs:
- If credentials are found, the server prints: `Successfully initialized Supabase Client.`
- If credentials are missing, it falls back silently to `db.json` local mode. No server crashes, no white screens, and no unhandled runtime exceptions.
