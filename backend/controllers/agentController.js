const Ticket = require('../models/ticketModel');
const getDashboard = async (req, res) => {
  try {
    const agentId = req.user.id; // from verifyToken middleware

    // 1️⃣ Total tickets assigned to this agent
    const totalTickets = await Ticket.countDocuments({ assignedTo: agentId });

    // 2️⃣ Count tickets by status
    const statusCounts = await Ticket.aggregate([
      { $match: { assignedTo: agentId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 3️⃣ SLA breakdown
    const now = new Date();
    const slaActive = await Ticket.countDocuments({
      assignedTo: agentId,
      slaDeadline: { $gte: now }
    });
    const slaBreached = await Ticket.countDocuments({
      assignedTo: agentId,
      slaDeadline: { $lt: now },
      status: { $ne: 'closed' }
    });

    // 4️⃣ Recent tickets
    const recentTickets = await Ticket.find({ assignedTo: agentId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('createdBy', 'name email')
      .select('title status slaDeadline createdAt updatedAt');

    // 5️⃣ Optional: Breached tickets list
    const breachedTickets = await Ticket.find({
      assignedTo: agentId,
      slaDeadline: { $lt: now },
      status: { $ne: 'closed' }
    })
      .populate('createdBy', 'name email')
      .select('title status slaDeadline');

    // ✅ Send summary
    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        statusCounts,
        sla: {
          active: slaActive,
          breached: slaBreached
        },
        recentTickets,
        breachedTickets
      }
    });
  } catch (error) {
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
};


module.exports={
  getDashboard,
}