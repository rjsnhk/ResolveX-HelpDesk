const express = require("express");
const {
  createTicket,
  getTicketById,
  addComment,
  getAllTickets
} = require("../controllers/ticketController");

const {
  updateTicket,
  deleteTicket,
  getDashboard
} = require("../controllers/userController");

const {
  verifyToken,
  authorize,
  canModifyTicket,
} = require("../middleware/auth");

const userRouter = express.Router();

// POST /api/tickets
userRouter.post("/add-ticket", verifyToken, authorize(["user"]), createTicket);

//user only can get only their personal tickets
// GET /api/tickets?status=open&limit=10&offset=0
userRouter.get("/tickets", verifyToken, getAllTickets);

// GET /api/tickets/:id
userRouter.get("/tickets/:id", verifyToken, getTicketById);

//only user can edit their tickets if status is open
// PATCH /api/tickets/:id
userRouter.patch("/update-ticket/:id", verifyToken, canModifyTicket, updateTicket);

// POST /api/tickets/:id/comments
userRouter.post("/add-comment/:id/comments", verifyToken, addComment);

// DELETE /api/tickets/:id
userRouter.delete("/delete-ticket/:id", verifyToken, canModifyTicket, deleteTicket);

//dashboard stats
userRouter.get("/dashboard", verifyToken,authorize(["user"]), getDashboard);

module.exports = userRouter;
