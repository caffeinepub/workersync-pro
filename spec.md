# WorkerSync Pro

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Authentication/registration screen with username, unique ID code (manual + auto-generate), and role selection (Owner/Worker/Driver)
- Session persistence in localStorage
- Owner dashboard with stats (total workers, active workers, task summary), glowing neon cards
- Owner: Worker management (add/edit/delete), task assignment, broadcast messaging, analytics view, live location tracking map, chat access, block/unblock users
- Worker interface: assigned tasks list, task status update (Complete/Pending), chat with owner, location sharing
- Driver interface: current delivery task (pickup/drop), large action buttons (Start Trip, Complete Delivery, Call Owner, Quick Chat), live location share/stop
- Chat system: search by ID code, chat history with timestamps, last message preview, text/image/document support
- Block/unblock contacts, blocked list management
- Live location system: share/stop toggle, 10-20s update interval, owner map tracking, last known location saved
- Task management: assign, accept/reject, mark complete
- Status system: Online/Offline/Last Seen
- In-app notifications: new message, task assigned, task completed, location sharing started
- App lock: 4-digit PIN, failed attempt protection, auto logout on inactivity
- Activity log: login, task updates, data changes
- Data backup/restore

### Modify
- N/A (new project)

### Remove
- N/A

## Implementation Plan

### Backend (Motoko)
- User registration and lookup by ID code (uniqueness enforced)
- Session management
- Worker CRUD operations
- Task CRUD: assign, accept/reject, update status
- Message store: send/receive by sender/receiver ID, timestamps
- Location store: upsert location by user ID
- Block/unblock users
- Activity log entries
- Role-based access guards
- Broadcast message support
- Analytics: task counts by date, worker performance

### Frontend (React + TypeScript)
- Mobile-first layout (max-width ~430px, centered)
- Dark neon theme: black/dark-gray bg, purple/electric-blue/cyan/pink neon accents, glowing box-shadows
- Pages/screens: Login/Register, Owner Dashboard, Worker Dashboard, Driver Dashboard, Worker Management, Task Management, Chat List, Chat Room, Live Location Map, Activity Log, Settings/App Lock, Analytics
- Role-based routing after login
- localStorage for session and PIN lock state
- Simulated live location updates (geolocation API + interval)
- Map view using Leaflet.js for location tracking
- Notification banners for in-app alerts
