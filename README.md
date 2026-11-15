# Sprintly — Production Project Management & Team Collaboration SaaS

**Sprintly** is an end-to-end, production-ready Project Management and Team Collaboration SaaS platform built for high-velocity software engineering teams, marketing agencies, and startups.

---

## Architecture Overview

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Framer Motion, Recharts, dnd-kit.
- **Backend & Database**: Google Cloud Firestore with real-time reactive snapshots, compound query indices, and granular subcollections.
- **Authentication**: Firebase Authentication supporting Email/Password, Google OAuth, and an isolated instant demo sandbox session.
- **Storage**: Firebase Storage with security policies enforcing max file sizes (25MB general, 5MB image) and workspace membership.
- **Serverless Operations**: Cloud Functions for Firebase (v2 modular functions) handling atomic workspace provisioning, invitation token hashing/redemption, activity feeds, task sequence generation, and push notification triggers.
- **Security Rules**: Comprehensive `firestore.rules` and `storage.rules` preventing unauthorized writes, client-side role escalation, and unentitled tier modification.

---

## Directory Structure

```
SPRINTLY/
├── firestore.rules           # Firestore security rules
├── storage.rules             # Storage security rules
├── firestore.indexes.json    # Firestore compound query indexes
├── firebase.json             # Firebase emulator & deployment configuration
├── functions/                # Cloud Functions v2 TypeScript package
│   ├── src/
│   │   ├── index.ts          # Callable & Firestore trigger functions
│   │   ├── lib/admin.ts      # Firebase Admin SDK initialization
│   │   └── lib/plans.ts      # Workspace tier limits & entitlements
│   └── package.json
└── src/
    ├── app/                  # Next.js App Router routes & pages
    │   ├── app/              # Protected application workspace views
    │   │   ├── page.tsx      # Main dashboard with live analytics
    │   │   ├── projects/     # Projects directory and project workspaces
    │   │   ├── my-tasks/     # Personal task agenda
    │   │   ├── calendar/     # Deliverables calendar view
    │   │   ├── inbox/        # Notification center
    │   │   ├── team/         # Team & invitation management
    │   │   ├── reports/      # Aggregated metrics & CSV exports
    │   │   └── settings/     # Workspace, profile & billing settings
    │   ├── login/            # Sign in
    │   ├── signup/           # User registration
    │   ├── onboarding/       # Multi-step workspace provisioning flow
    │   └── invite/[token]/   # Secure token acceptance page
    ├── components/           # Reusable UI & modal components
    ├── hooks/                # Firestore reactive hooks (useCollection, useDocument)
    ├── lib/
    │   ├── firebase/         # Firebase client, Firestore paths, App Check & FCM
    │   ├── services/         # Domain services (auth, tasks, projects, comments, files)
    │   ├── plans.ts          # Pricing & subscription definitions
    │   └── utils.ts          # Formatting, search tokens, CSV generator
    ├── providers/            # AuthProvider & WorkspaceProvider
    └── types/                # Strongly-typed data models
```

---

## Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Firebase credentials:
```bash
cp .env.example .env.local
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Exploring the Demo Workspace
Click **"Explore Acme Studio Demo"** on the landing page or login screen to immediately instantiate an isolated, fully seeded workspace featuring 6 team members, 4 projects, and realistic tasks across all stages.

---

## Building for Production
```bash
# Compile Cloud Functions
cd functions && npm run build && cd ..

# Build Next.js application
npm run build
```
