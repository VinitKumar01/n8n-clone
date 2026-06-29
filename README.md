# n8n-clone

An open-source workflow automation tool built with Turborepo, Next.js, and Go, heavily inspired by n8n.

For a detailed breakdown of the system design, components, and step-by-step execution workflows, see the **[ARCHITECTURE.md](ARCHITECTURE.md)** guide.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) (Package manager used for this project)
- [Go](https://golang.org/)
- [Docker](https://www.docker.com/) (For running PostgreSQL locally)
- [ngrok](https://ngrok.com/) (For webhook testing with Clerk)

## Environment Variables

Create `.env` files in both the frontend and backend applications using the following configurations.

### Backend (`apps/backend/.env`)

```env
PORT=8080
DB_URL="postgres://postgres:mypassword@localhost:5432/n8n-clone?sslmode=disable"
# Get this from your Clerk Dashboard > Webhooks
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Frontend (`apps/web/.env`)

```env
# Get these from your Clerk Dashboard > API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BACKEND_URL="http://localhost:8080/v1"
```

### How to get Clerk credentials

1. Create an account on [Clerk](https://clerk.com/) and set up a new application.
2. Go to **API Keys** to get your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. To get the `CLERK_WEBHOOK_SECRET`, go to **Webhooks**, add an endpoint pointing to your ngrok URL (`https://<your-ngrok-id>.ngrok-free.app/v1/clerk/webhook`), and copy the signing secret.

## Local Setup Instructions

1. **Start the PostgreSQL database via Docker:**

   ```sh
   docker run --name n8n-postgres -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=n8n-clone -p 5432:5432 -d postgres
   ```

   _Note: If you want to use a different database, make sure to update the `DB_URL` in your backend `.env` accordingly._

2. **Expose your local backend using ngrok (for Clerk Webhooks):**

   ```sh
   ngrok http 8080
   ```

   _Note: Keep this running in the background and update your Clerk Webhook URL with the forwarded HTTPS address._

3. **Install dependencies:**
   From the root of the monorepo:

   ```sh
   bun install
   ```

4. **Run database migrations:**
   Before starting the backend, you need to apply the database schema. Navigate to the backend directory and run the migration command:

   ```sh
   cd apps/backend
   make migrate-up
   cd ../..
   ```

5. **Run the project (Turborepo):**
   To start both the frontend and backend concurrently:

   ```sh
   bun run dev
   ```

   Alternatively, you can run them individually:
   - Frontend only: `bun run dev:web`
   - Backend only: `bun run dev:backend`

## Available Nodes

The platform currently supports the following automation nodes:

- **Manual Trigger**: Triggers the workflow manually from the UI.
- **Webhook**: Triggers the workflow when an external HTTP request is received.
- **Scheduler**: Triggers workflows periodically on a defined schedule.
- **Gemini AI**: Interfaces with Google's Gemini AI to generate text based on prompts (Requires a Gemini API Key).
- **Resend**: Sends emails programmatically using the Resend API (Requires a Resend API Key).
- **Merge**: Merges multiple branch inputs into a single output string.
- **Show Output**: A utility node that outputs the data it receives.

## Important Setup Notes

- **Webhooks:** Because the backend relies on Clerk for user authentication events (like user creation), it's crucial to have `ngrok` running and the Clerk webhook properly configured with your ngrok URL. Without it, user synchronization won't work locally.
- **Database Migrations:** The `Makefile` in `apps/backend/` handles database migrations using Goose. You can use `make new-migration NAME=...` to create new migrations and `make migrate-up` to apply them.
