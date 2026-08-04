# Prodify — AI-Powered Workspace Dashboard
## Comprehensive Project Documentation & Technical Overview

Prodify is a premium, state-of-the-art, full-stack task management and team collaboration web application. It integrates real-time workspace updates, instant chat messaging, a dynamic weekly calendar strip, custom workspace events, daily checklist trackers, and a streaming AI assistant powered by Gemini.

---

## 🛠️ 1. Technology Stack

*   **Frontend UI Layer**: Next.js 16 (App Router, Turbopack compiler) built on React 19.
*   **Styling Engine**: Tailwind CSS 4 utilizing modern Outfit and Inter typography, sleek Glassmorphism, tailored HSL color palettes, and responsive layouts.
*   **Database ORM**: Prisma (v7.9.1) utilizing a PostgreSQL database connection.
*   **Cloud Database**: Neon (PostgreSQL Serverless).
*   **Backend Server (HTTP & WebSockets)**: A custom Node.js HTTP/HTTPS server (`server.js`) integrating Next.js request routing and `ws` (WebSockets) on a unified single port.
*   **Authentication**: Custom JSON Web Token (JWT) rotation using stateless access/refresh tokens securely packed into HttpOnly cookies via the `jose` encryption library.
*   **AI Integration**: Google Gemini API (`@google/generative-ai`) utilizing model `gemini-3.6-flash` for streaming workspace data-guided contextual conversations.
*   **Icons**: Lucide React.
*   **Hosting**:
    *   **Frontend UI & Serverless API Routes**: Vercel.
    *   **WebSocket & HTTP Server Daemon**: Railway.

---

## 📂 2. File Directory & Purpose

### Core Layouts & Routes
*   [`app/layout.tsx`](./app/layout.tsx): Root layout declaring global HTML, viewport settings, SEO metadata exports, direct Outfit Google Font bindings, and global Toast notifications provider wrapper.
*   [`app/(dashboard)/layout.tsx`](./app/(dashboard)/layout.tsx): Main dashboard shell layout containing the responsive sidebar navigation, workspace-switched profile details fetchers, and the background WebSocket listener that collects live notifications and saves them to local storage.
*   [`app/(dashboard)/dashboard/page.tsx`](./app/(dashboard)/dashboard/page.tsx): Main landing route rendering active workspace summaries, projects list, daily checklist, mini-calendar, and dynamic deadline reminders.
*   [`app/(dashboard)/my-tasks/page.tsx`](./app/(dashboard)/my-tasks/page.tsx): Tasks management workspace. Allows inline status updates (browser-native dropdown selects to prevent overflow clipping), detail sidepanels, edit forms, deletion, comment logs, screenshot clipboard pasting, and base64 file attachment submissions.
*   [`app/(dashboard)/calendar/page.tsx`](./app/(dashboard)/calendar/page.tsx): Calendar interface compiling task deadlines and custom independent workspace events with color-coded dot badges and detail popups.
*   [`app/(dashboard)/inbox/page.tsx`](./app/(dashboard)/inbox/page.tsx): Real-time chat workspace displaying channels (Teams), direct messages list, user presence indicators, instant message pings, and typing indicator logs.
*   [`app/(dashboard)/prodify-ai/page.tsx`](./app/(dashboard)/prodify-ai/page.tsx): AI chatbot conversation thread interface supporting session history, Markdown-rendered assistant streaming, and quick prompt presets.

### UI Components
*   [`components/layout/sidebar.tsx`](./components/layout/sidebar.tsx): Responsive navigation aside pane containing workspace switch listings, user profiles, project directories, "Invite to Workspace" forms, and sticky constraints.
*   [`components/layout/header.tsx`](./components/layout/header.tsx): Global navbar displaying search results, theme toggle, and the notification bell dropdown displaying unread badges.
*   [`components/dashboard/goals-panel.tsx`](./components/dashboard/goals-panel.tsx): Interactive daily goal checklist. Handles instant task add, task complete checkbox toggles, deletion, and linear progress calculators.
*   [`components/dashboard/calendar-panel.tsx`](./components/dashboard/calendar-panel.tsx): Weekly horizontal strip centering around the selected date, loading database tasks and custom events for the selected day.
*   [`components/dashboard/reminders-panel.tsx`](./components/dashboard/reminders-panel.tsx): Alerts list scanning active database tasks and warning users of deadlines due in 1 day (within 36 hours).

### API Endpoints
*   [`app/api/auth/register/route.ts`](./app/api/auth/register/route.ts): Handles new user registration, hashes passwords, and boots a default workspace.
*   [`app/api/auth/login/route.ts`](./app/api/auth/login/route.ts): Authenticates user credentials and signs JWT cookies.
*   [`app/api/tasks/[id]/route.ts`](./app/api/tasks/[id]/route.ts): Handles PATCH (status/priority updates) and DELETE operations for individual tasks, broadcasting updates via WebSockets.
*   [`app/api/tasks/[id]/comments/route.ts`](./app/api/tasks/[id]/comments/route.ts): GET and POST handlers storing work attachments (base64) and comments in the database.
*   [`app/api/calendar-events/route.ts`](./app/api/calendar-events/route.ts): REST endpoint for custom independent workspace events.
*   [`app/api/daily-goals/route.ts`](./app/api/daily-goals/route.ts): Handles daily checkable goal logs for the active workspace.
*   [`app/api/ai/chat/route.ts`](./app/api/ai/chat/route.ts): Stream endpoint feeding database project contexts into Gemini for streaming conversations.

---

## 🔑 3. Authentication & Authorization Strategy

Prodify uses a secure, stateless **JSON Web Token (JWT)** cookie authentication system:
1.  **JWT Pair Generation**: On login/registration, the backend generates an `accessToken` (expires in 15 minutes) and a `refreshToken` (expires in 7 days).
2.  **HttpOnly Cookies**: The tokens are serialized and saved inside cookies with parameters `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`. This makes them immune to Client XSS script theft.
3.  **Automatic Token Rotation**:
    *   [`middleware.ts`](./middleware.ts) acts as a gateway intercepting every page load and API route.
    *   If the `accessToken` is expired but the `refreshToken` is valid, the middleware calls `/api/auth/refresh` behind the scenes, signs a new access token, updates the cookie headers, and resumes the user's session without interrupting their experience.
4.  **Database Session Checks**: User workspaces and payload IDs are verified in every route by querying [`lib/auth.ts`](./lib/auth.ts) to match active tokens against registered users.

---

## 📈 4. Phase-by-Phase Development Log

### Phase 0 to 4: Layout and Foundation
*   **Phase 0**: Initial next.js workspace bootstrapping, ESLint and TypeScript setups.
*   **Phase 1**: Removed Purple Gradient and restored native full-screen layouts. Built modern grid components and clean dashboard typography.
*   **Phase 2**: Wired Next.js layouts with custom routing, and added project creation hooks directly from the dashboard grid.
*   **Phase 3**: Developed the workspace switching dialog to let users switch profiles on demand.
*   **Phase 4**: Setup database models (User, Workspace, WorkspaceMember, Projects, Tasks) in Prisma.

### Phase 5 to 8: Real-Time Features & Client Controls
*   **Phase 5**: Implemented full real-time chat (Inbox) in Node with WebSockets, handling channels, direct messages, and typing indicators.
*   **Phase 6**: Replaced absolute custom dropdowns inside task tables with styled native select menus to resolve clipping bugs. Added task edit/delete routes.
*   **Phase 7**: Built comments endpoints, serializing file uploads (images, PDFs) and clipboard pasted screenshots into base64 strings stored inside JSON comment blocks.
*   **Phase 8**: Refined UI overlays, replacing alert calls with custom confirm modals.

### Phase 9: Custom Features & Production Deployments
*   **Daily Goals & Calendar Alignment**: Added the `DailyGoal` and `CalendarEvent` models. Built interactive checklist inputs, weekly strip generators, and reminders for tasks due within 36 hours.
*   **Single-Port WebSockets**: Unified Next.js HTTP and ws servers into a shared port model to resolve deployment routing blocks.
*   **Notifications Bell**: Routed all background broadcasts into a local storage log scoped by `userId` and `workspaceId` with read indicators.

---

## ⚡ 5. Production Challenges & Resolutions

### Challenge 1: Local Storage Cross-User Leakage
*   *Symptom*: When User A logged out and User B logged in on the same browser, User B could read all of User A's past notifications.
*   *Solution*: Modified layout and header hooks to save and query notifications using a scoped key template: `prodify_notifications_${userId}_${workspaceId}`. This completely isolated user alerts on shared machines.

### Challenge 2: Next.js Static Page Generator Crashes at Build Time
*   *Symptom*: Building on Vercel/Railway crashed with `DATABASE_URL is not defined` when analyzing static API routes.
*   *Solution*: Added a fallback to a dummy connection string in `lib/db.ts` during compile time if `DATABASE_URL` is missing. This allows static pages to compile cleanly.

### Challenge 3: Exposing WebSockets in Cloud Hosting (Render & Railway)
*   *Symptom*: Cloud providers only expose a single port publicly (mapping to `PORT`). Hardcoding WebSockets to port 3001 resulted in blocked connections.
*   *Solution*: Rewrote `server.js` to attach the WebSocket server (`wss`) directly to the HTTP server instance. Now, both HTTP requests and WebSocket upgrades route through the same port (e.g. `8080`), solving the problem completely.

### Challenge 4: Missing Database Tables on Neon
*   *Symptom*: Registration returned a 500 error because `public.User does not exist`.
*   *Solution*: Executed `npx prisma db push` targeting the live Neon PostgreSQL connection string, creating all tables (including newer calendar event models) in seconds.
