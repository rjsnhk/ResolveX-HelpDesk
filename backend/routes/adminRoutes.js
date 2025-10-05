const express = require('express');
const {
  verifyToken,
  authorize
} = require('../middleware/auth');

const {
  assignTicketToAgent,
  getDashboard,
  addAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent,
  registerAdmin
} = require('../controllers/adminController');

const { getTicketById, addComment,updateTicketStatus, getAllTickets } = require('../controllers/ticketController');

const adminRouter = express.Router();

adminRouter.post("/register", registerAdmin);

// 1️⃣ Get all tickets (with filters & pagination)
// GET /api/admin/tickets?status=open&agent=123&limit=10&offset=0
adminRouter.get('/tickets', verifyToken, authorize(['admin']), getAllTickets);



// GET /api/tickets/:id
adminRouter.get("/tickets/:id", verifyToken, getTicketById);

adminRouter.post("/add-agent", verifyToken, authorize(["admin"]), addAgent);

adminRouter.get("/agents", verifyToken, authorize(["admin"]), getAllAgents);

adminRouter.get("/agents/:id", verifyToken, authorize(["admin"]), getAgentById);

adminRouter.patch("/agents/:id", verifyToken, authorize(["admin"]), updateAgent);

adminRouter.delete("/agents/:id", verifyToken, authorize(["admin"]), deleteAgent);

// 2️⃣ Assign / reassign ticket to an agent
// PATCH /api/admin/tickets/:id/assign
adminRouter.patch('/tickets/:id/assign', verifyToken, authorize(['admin']), assignTicketToAgent);

// 3️⃣ Update ticket status (resolved / closed)
// PATCH /api/admin/tickets/:id/status
adminRouter.patch('/tickets/:id/status', verifyToken, authorize(['admin']), updateTicketStatus);

// 4️⃣ Add admin comment
// POST /api/admin/tickets/:id/comments
adminRouter.post('/tickets/:id/comments', verifyToken, authorize(['admin']), addComment);

// 5️⃣ Dashboard stats (aggregated data)
// GET /api/admin/dashboard
adminRouter.get('/dashboard', verifyToken, authorize(['admin']), getDashboard);

module.exports = adminRouter;
