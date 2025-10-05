
# 🧩 ResolveX Help Desk

A modern Help Desk web application for managing customer support tickets efficiently.  
Built with a full MERN stack — React ⚛️, Node.js 🚀, Express 🧠, and MongoDB 🍃.

🌐 **Live Link:** [ResolveX Help Desk](https://resolve-x-help-desk.vercel.app/)

---

## 🚀 Tech Stack

### 🎨 Frontend
- ⚛️ **React.js**
- 🪄 **Context API** (for state management)
- 💅 **Tailwind CSS**

### 🧠 Backend
- 🧾 **Node.js**
- 🧩 **Express.js**
- 🍃 **MongoDB (Mongoose ORM)**

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/rjsnhk/ResolveX-HelpDesk.git
cd ResolveX-HelpDesk
````

---

### 2️⃣ Setup the Frontend

```bash
cd frontend
npm install
npm run dev
```

🧭 The frontend will start running on [http://localhost:5173](http://localhost:5173)

---

### 3️⃣ Setup the Backend

```bash
cd ../backend
npm install
```

🗝️ **Create a `.env` file** in the `backend` folder and add the following:

```env
MONGO_URI="xxxxxx-ccc-ccc"

JWT_SECRET="sdf-dfgh-fgh"

ADMIN_KEY="sdf-hggf"
```

Then run:

```bash
npm run dev
```

🧭 The backend will start on [http://localhost:5000](http://localhost:5000)

---

## 📁 Folder Structure

```
ResolveX-HelpDesk/
│
├── frontend/     # React Frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/      # Node.js + Express Backend
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   └── server.js
│
└── README.md
```

---

## 🧑‍💻 Author

**Rajesh Nahak**
🔗 [GitHub Profile](https://github.com/rjsnhk)

---


## 🏁 Features

- ✅ **User Authentication (JWT)** — Secure login using JSON Web Tokens with cookie support.
- ✅ **Role-based Access** — Role-based middleware for `user`, `agent`, and `admin`.
- ✅ **Ticket Management** — Create, edit (optimistic locking), comment (threaded), and delete (only if `open`).
- ✅ **SLA Handling (24-hour)** — Each ticket has an SLA deadline; `slaStatus` and `slaTimeRemaining` are exposed.
- ✅ **Searchable Timeline** — Timeline logs actions and is searchable (title, description, latest comment).
- ✅ **Pagination & `next_offset`** — All lists support `?limit=&offset=` and return `{ items, next_offset }`.
- ✅ **Idempotency for POSTs** — `Idempotency-Key` header supported to prevent duplicate creates.
- ✅ **Rate Limiting** — 60 requests/min per user; exceeds → `429 { "error": { "code": "RATE_LIMIT" } }`.
- ✅ **Frontend** — React + Context API + Tailwind CSS.
- ✅ **Backend** — Node.js, Express, MongoDB (Mongoose).


---

## 📜 License

This project is open source under the [MIT License](LICENSE).

---

✨ **Made with ❤️ using the MERN Stack**

```

---

Would you like me to add **badges** (like `![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)` for each tech) at the top of the README for a more polished look?
```
