const express = require('express');
const {
  verifyToken,
  authorize,
  canModifyTicket
} = require('../middleware/auth');

const {
  addComment,
  getTicketById,
  getAllTickets,
  updateTicketStatus
} = require('../controllers/ticketController');


const { getDashboard } = require('../controllers/agentController');

const agentRouter = express.Router();

// 1️⃣ Get all tickets assigned to this agent
// GET /api/agent/tickets?status=open&limit=10&offset=0
agentRouter.get('/tickets', verifyToken, authorize(['agent']), getAllTickets);


// GET /api/tickets/:id
agentRouter.get("/tickets/:id", verifyToken, getTicketById);


// 2️⃣ Update ticket status (open → in_progress → resolved → closed)
// PATCH /api/agent/tickets/:id/status
agentRouter.patch('/tickets/:id/status', verifyToken, canModifyTicket, updateTicketStatus);

// 3️⃣ Add comment to ticket
// POST /api/agent/tickets/:id/comments
agentRouter.post('/tickets/:id/comments', verifyToken, canModifyTicket, addComment);


//dashboard stats
agentRouter.get('/dashboard', verifyToken, authorize(['agent']), getDashboard);

module.exports = agentRouter;
