# MikePfunk's AI Hub

## Overview

MikePfunk's AI Hub is a comprehensive platform designed to aggregate AI research, track market trends, manage projects, and deliver personalized intelligence reports. It serves as a single pane of glass for navigating the rapidly evolving AI ecosystem, built with a focus on enterprise-grade security and user experience.

## Features - Showcasing Innovation and Impact

This platform boasts a robust set of features designed to deliver significant value and demonstrate innovative solutions, crucial for a hackathon setting:

*   **AI Research Aggregation:** **Effortlessly stay updated** with the latest AI papers, research, and breakthroughs from various sources, providing a **centralized knowledge hub**.
*   **Market Intelligence:** **Gain real-time insights** into AI/tech stock performance, funding rounds, and market trends with **predictive analytics**, empowering informed decisions.
*   **Knowledge Management:** **Intelligently organize and retrieve** research papers, prompts, and templates with **AI-powered search and semantic understanding**, transforming information overload into actionable knowledge.
*   **Automated Newsletters:** **Receive personalized, curated intelligence reports** daily and weekly, delivering **actionable recommendations** directly to your inbox.
*   **Project Integration:** **Seamlessly connect with GitHub repositories**, track project metrics, and leverage **AI-powered implementation suggestions** to accelerate development.
*   **User Authentication:** **Secure and scalable user management** powered by Supabase, ensuring **robust login and signup functionality**.
*   **Protected Routes:** **Implement granular access control**, safeguarding sensitive areas of the application and ensuring data integrity.
*   **Responsive Design:** **Deliver a consistent and intuitive user experience** across all devices, from mobile to desktop, showcasing **adaptability and accessibility**.

## Technologies Used

*   **Frontend:**
    *   React (with Vite)
    *   TypeScript
    *   Tailwind CSS
    *   Radix UI
    *   Lucide React (icons)
    *   React Router DOM
*   **Backend (BaaS):**
    *   Supabase (Authentication, Database)
*   **Package Manager:**
    *   pnpm

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   Node.js (LTS version recommended)
*   pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-github-repo-url>
    cd ai-hub
    ```
    *(Note: Replace `<your-github-repo-url>` with the actual URL of your GitHub repository once it's set up.)*

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Environment Variables

This project uses environment variables for sensitive information like Supabase credentials.

1.  **Create a `.env` file:** In the root of your project, create a file named `.env`.
2.  **Add your Supabase credentials:**
    ```
    VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    *(Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual Supabase project URL and anonymous key.)*

### Database Setup (Supabase)

The application relies on a Supabase database with specific tables.

1.  **Create a Supabase Project:** If you don't have one, create a new project on the [Supabase Dashboard](https://supabase.com/dashboard/projects).
2.  **Run SQL Migrations:** Execute the following SQL commands in your Supabase project's SQL Editor to create the necessary tables:

    ```sql
    -- Create the User table
    CREATE TABLE "User" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" text NOT NULL,
      "full_name" text,
      "avatar_url" text,
      "preferences" jsonb,
      "subscription_tier" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    -- Create the Project table
    CREATE TABLE "Project" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid REFERENCES "User"(id),
      "name" text NOT NULL,
      "description" text,
      "github_url" text,
      "status" text NOT NULL,
      "technologies" text[],
      "metrics" jsonb,
      "is_favorite" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    -- Create the KnowledgeItem table
    CREATE TABLE "KnowledgeItem" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid REFERENCES "User"(id),
      "title" text NOT NULL,
      "content" text,
      "source_url" text,
      "item_type" text NOT NULL,
      "tags" text[],
      "is_favorite" boolean DEFAULT false NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    -- Create the AIContent table
    CREATE TABLE "AIContent" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" text NOT NULL,
      "content" text,
      "summary" text,
      "url" text,
      "source" text NOT NULL,
      "content_type" text NOT NULL,
      "authors" text[],
      "published_at" timestamp with time zone,
      "relevance_score" real,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    -- Create the StockData table
    CREATE TABLE "StockData" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "symbol" text NOT NULL,
      "company_name" text,
      "price" real NOT NULL,
      "change_percent" real NOT NULL,
      "volume" bigint,
      "market_cap" bigint,
      "sector" text NOT NULL,
      "is_ai_related" boolean DEFAULT false NOT NULL,
      "timestamp" timestamp with time zone NOT NULL
    );

    -- Create the Hackathon table
    CREATE TABLE "Hackathon" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" text NOT NULL,
      "description" text,
      "url" text,
      "platform" text NOT NULL,
      "start_date" timestamp with time zone,
      "end_date" timestamp with time zone,
      "prize_amount" real,
      "location" text,
      "is_virtual" boolean DEFAULT false NOT NULL,
      "tags" text[],
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );

    -- Create the Newsletter table
    CREATE TABLE "Newsletter" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid REFERENCES "User"(id),
      "type" text NOT NULL,
      "title" text NOT NULL,
      "content" text NOT NULL,
      "generated_at" timestamp with time zone NOT NULL,
      "sent_at" timestamp with time zone,
      "is_personalized" boolean DEFAULT false NOT NULL
    );

    -- Create the Todos table (if needed by your application)
    CREATE TABLE public.todos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      text TEXT,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ```

### Running the Development Server

```bash
pnpm dev
```

This will start the development server, usually accessible at `http://localhost:5173`.

### Building for Production

To create a production-ready build of your application:

```bash
pnpm build
```

To build for a specific production mode:

```bash
pnpm build:prod
```

The build output will be in the `dist` directory.

### Deployment

This project is configured for deployment with Cloudflare Pages. Ensure your GitHub repository is connected to Cloudflare Pages, and it will automatically build and deploy your application using the `pnpm build` command.

## Branding

This platform is branded as "MikePfunk's AI Hub".

## License

[Specify your license here, e.g., MIT License]

## Support

For any questions or issues, please refer to the project's GitHub repository or contact the maintainer.