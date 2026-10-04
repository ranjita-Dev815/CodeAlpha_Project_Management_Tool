# 📋 Project Management Tool

A full-stack **MERN** project management application where teams can create projects, assign tasks, and track progress in one place. Built as part of the **CodeAlpha Full Stack Development Internship**.

🔗 **Live Demo (Vercel):** https://YOUR-APP.vercel.app
🔗 **Live Demo (Render):** https://codealpha-project-management-tool-ur31.onrender.com


## ✨ Features

- 🔐 Secure user registration and login with **JWT authentication**
- 📁 Create, update and delete projects
- ✅ Add tasks to projects and track their status (To Do / In Progress / Done)
- 👥 Assign tasks and collaborate with team members
- 📱 Responsive design that works on desktop and mobile
- ☁️ Cloud database using **MongoDB Atlas**

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcrypt |
| Deployment | Vercel (frontend), Render (backend) |



## 📸 Screenshots

Add your screenshots in a `screenshots/` folder and link them here:

| Login | Dashboard |
|-------|-----------|
| ![Login](screenshots/login.png) | ![Dashboard](screenshots/dashboard.png) |



## 📂 Project Structure

mern-project-management-tool/
├── client/          # React frontend
│   └── src/
├── server/          # Express backend
│   ├── models/
│   ├── routes/
│   └── index.js
└── README.md


## 🚀 Getting Started (Run Locally)

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/ranjita-Dev815/CodeAlpha_Project_Management_Tool.git
cd CodeAlpha_Project_Management_Tool
```

### 2. Setup the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

Start the server:

```bash
node index.js
```

### 3. Setup the frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev


The app will run at `http://localhost:5173` (or the port shown in your terminal).



## 🔑 Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `PORT` | Port for the server (default 5000) |

### Client (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the deployed backend |



## 🌐 Deployment

- **Backend:** Deployed on [Render](https://render.com) as a Web Service
- **Frontend:** Deployed on [Vercel](https://vercel.com)
- **Database:** MongoDB Atlas

---

## 🔮 Future Improvements

- Real-time updates with Socket.io
- Email notifications for task deadlines
- File attachments on tasks
- Role-based access control

---

## 👩‍💻 Author

**Ranjita Kumari**

- GitHub: [@ranjita-Dev815](https://github.com/ranjita-Dev815)
- LinkedIn: add your LinkedIn profile link here



## 🙏 Acknowledgements

Built during the **CodeAlpha** Full Stack Development Internship.



⭐ If you like this project, please give it a star!