# Taskboard: MERN Project Management Tool

Features: JWT auth, group projects, invite members by email, task cards (To do / In progress / Done),
assign tasks, comments, real-time updates + notifications (Socket.io).

## Run
Needs Node 18+ and MongoDB (local or Atlas).

    cd server && cp .env.example .env && npm install && npm start
    cd client && npm install && npm run dev      # open http://localhost:5173

Register 2 users in 2 browsers, invite one to a project, and watch tasks update live.

## API
POST /api/auth/register | /api/auth/login | GET /api/me
GET/POST /api/projects | POST /api/projects/:id/members
GET/POST /api/projects/:id/tasks | PATCH/DELETE /api/tasks/:id | POST /api/tasks/:id/comments
