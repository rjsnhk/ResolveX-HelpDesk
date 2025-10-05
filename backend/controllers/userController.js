const Ticket = require("../models/ticketModel");
const User = require("../models/userModel");

const getAllTickets = async (req, res) => {
  try {
    const userId = req.user._id; // current logged-in user
    const { status, limit = 10, offset = 0, search } = req.query;

    const filter = { createdBy: userId };

    // Filter by status if provided
    if (status) filter.status = status;

    // Search across title, description, and latest comment
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'timeline.details': { $regex: search, $options: 'i' } },
      ];
    }

    // 1️⃣ Total tickets for this user
    const totalTickets = await Ticket.countDocuments(filter);

    // 2️⃣ Count by status
    const statusCounts = await Ticket.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 3️⃣ Paginated tickets
    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      totalTickets,
      statusCounts,
      limit: Number(limit),
      offset: Number(offset),
      data: tickets
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    // 1️⃣ Find the ticket
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    // 2️⃣ Check if the ticket belongs to this user
    if (ticket.user.toString() !== userId) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You are not allowed to update this ticket" },
      });
    }

    // 3️⃣ Allow update only if status is "open"
    if (ticket.status !== "open") {
      return res.status(400).json({
        error: {
          code: "INVALID_OPERATION",
          message: "You can only update tickets that are in 'open' state",
        },
      });
    }

    // 4️⃣ Update only fields provided in request body
    let updated = false;

    if (typeof title === "string" && title.trim() !== "") {
      ticket.title = title.trim();
      updated = true;
    }

    if (typeof description === "string" && description.trim() !== "") {
      ticket.description = description.trim();
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({
        error: {
          code: "NO_FIELDS_PROVIDED",
          message: "Please provide at least one field (title or description) to update",
        },
      });
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: error.message },
    });
  }
};
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;      // Ticket ID
    const userId = req.user.id;     // From auth middleware

    // 1️⃣ Find the ticket
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
    }

    // 2️⃣ Check if this ticket belongs to the logged-in user
    if (ticket.user.toString() !== userId) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You are not allowed to delete this ticket" },
      });
    }

    // 3️⃣ Allow deletion only if status = "open"
    if (ticket.status !== "open") {
      return res.status(400).json({
        error: { 
          code: "INVALID_OPERATION", 
          message: "You can only delete tickets that are in 'open' state" 
        },
      });
    }

    // 4️⃣ Delete the ticket
    await Ticket.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: error.message },
    });
  }
};
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const total = await Ticket.countDocuments({ createdBy: userId });
    const open = await Ticket.countDocuments({ createdBy: userId, status: 'open' });
    const inProgress = await Ticket.countDocuments({ createdBy: userId, status: 'in_progress' });
    const resolved = await Ticket.countDocuments({ createdBy: userId, status: 'resolved' });
    const closed = await Ticket.countDocuments({ createdBy: userId, status: 'closed' });

    const breached = await Ticket.countDocuments({
      createdBy: userId,
      slaDeadline: { $lt: new Date() }
    });

    res.json({
      success: true,
      summary: { total, open, inProgress, resolved, breached }
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

module.exports = {
  getAllTickets,
  updateTicket,
  deleteTicket,
  getDashboard
};