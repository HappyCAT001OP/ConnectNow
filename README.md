Hey,

I BUILT 🎥 ConnectNow – Full Stack Collaboration & Video Conferencing App

View Project [here](https://connectnow.vercel.app/).

ConnectNow is a full-stack collaborative meeting application that replicates key Zoom functionalities and adds real-time code sharing, whiteboard, and chat. It enables users to log in securely, create and manage meetings, schedule future sessions, and access recordings — all through a sleek and responsive UI.

🤖 Introduction

ConnectNow is a full-stack video conferencing application that replicates key Zoom functionalities. It enables users to log in securely, create and manage meetings, schedule future sessions, and access recordings — all through a sleek and responsive UI.

 ⚙️ Tech Stack

- Framework: Next.js 14+ with App Router
- Language: TypeScript
- Auth: Clerk
- Video SDK: Stream Video React-SDK
- UI Library: Shadcn UI
- Styling: Tailwind CSS
- Real-time Collaboration: Yjs, y-websocket
- Whiteboard: TLDraw
- Code Editor: Monaco Editor


🔋 Features

- Secure Authentication: Powered by Clerk, supporting social login and email/password with role-based access control.
- Instant Meetings: Start a new meeting instantly with mic and camera setup.
- Advanced Meeting Controls:
  - Start/stop recording
  - Screen sharing
  - Emoji reactions
  - Participant management (mute, pin, block, etc.)
  - Layout switching (grid, speaker view)
- Meeting Scheduling: Schedule future meetings with configurable date/time and accessible links.
- Upcoming Meetings Dashboard: View and manage scheduled sessions.
- Past Meeting Logs: Browse previously held meetings with metadata.
- Meeting Recordings: Watch recorded sessions for review.
- Personal Room: A dedicated, persistent meeting link per user.
- Join by Link: Enter meetings directly via shared URLs.
- Real-Time & Secure: Low-latency updates with full data privacy.
- Mobile-Responsive: Fully responsive layout for mobile and desktop.
- Real-time Collaborative Whiteboard: 
  - Multi-user drawing and sketching
  - Host-controlled permissions system
  - View-only mode for participants without edit permissions
- Real-time Code Sharing:
  - Collaborative code editing with syntax highlighting
  - Permission management for controlled access

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Then, start the YJS WebSocket server for real-time collaboration:

```bash
npm run y-websocket-server
# or
yarn y-websocket-server
```

Finally, run the development server in a separate terminal:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory and add the following environment variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Stream Video
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# YJS WebSocket Server (for real-time collaboration)
NEXT_PUBLIC_YJS_URL=ws://localhost:1234
```

