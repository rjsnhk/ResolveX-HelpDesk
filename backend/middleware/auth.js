const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Ticket = require('../models/ticketModel');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

// JWT-based authentication
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    req.cookies.helpdeskToken ||
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null);

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, SECRET);

    // ✅ Directly attach decoded payload (id & role)
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Token has expired."
        : "Invalid or expired token.";
    return res.status(401).json({ success: false, message });
  }
};


// Role-based authorization
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

// Ticket-level authorization (for editing/updating)
const canModifyTicket = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const user = req.user;

    // 🛡️ Admin can modify any ticket
    if (user.role === 'admin') return next();

    // 🧰 Agent can modify tickets assigned to them or unassigned ones
    if (
      user.role === 'agent' &&
      (!ticket.assignedTo || ticket.assignedTo.toString() === user._id.toString())
    ) {
      return next();
    }

    // 👤 User can modify their own ticket only if:
    // - The ticket is created by them,
    // - The ticket is unassigned,
    // - The status is 'open' or 'in_progress'
    if (
      user.role === 'user' &&
      ticket.createdBy.toString() === user._id.toString() &&
      !ticket.assignedTo &&
      (ticket.status === 'open' || ticket.status === 'in_progress')
    ) {
      return next();
    }

    // ❌ Otherwise, deny modification
    return res.status(403).json({
      success: false,
      message: 'You cannot modify this ticket.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  verifyToken,      // JWT-based auth
  authorize,
  canModifyTicket
};
