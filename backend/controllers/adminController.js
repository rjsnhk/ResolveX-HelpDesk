const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');
const bcrypt = require("bcrypt");



const saltRounds = 10;
const admin_key = process.env.ADMIN_KEY; // secret key to register admin

// ✅ Utility: validate email
const isCorrectEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

// Register Admin Controller
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, key } = req.body;

    // 1️⃣ Required fields check
    if (!name || !email || !password || !key) {
      return res.status(422).json({
        success: false,
        message: "All fields (name, email, password, key) are required",
      });
    }

    // 2️⃣ Validate email format
    if (!isCorrectEmail(email)) {
      return res.status(422).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 3️⃣ Check secret key
    if (key !== admin_key) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Invalid secret key",
      });
    }

    // 4️⃣ Check if admin already exists
    const existingAdmin = await User.findOne({ email, role: "admin" });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin already exists with this email",
      });
    }

    // 5️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 6️⃣ Create new admin
    const newAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    // 7️⃣ Respond with success
    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Contact the Development Team.",
      error: error.message,
    });
  }
};




// 2️⃣ Assign / reassign ticket to an agent
const assignTicketToAgent = async (req, res) => {
  try {
    const { id } = req.params; // ticket id
    const { agentId } = req.body;

    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) {
      return res.status(400).json({ success: false, message: 'Invalid agent ID' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { assignedTo: agentId },
      { new: true }
    )
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.status(200).json({
      success: true,
      message: `Ticket assigned to ${agent.name}`,
      ticket
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3️⃣ Dashboard (Admin overview)
const getDashboard = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'open' });
    const inProgressTickets = await Ticket.countDocuments({ status: 'in_progress' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
    const closedTickets = await Ticket.countDocuments({ status: 'closed' });

    const totalAgents = await User.countDocuments({ role: 'agent' });
    const totalUsers = await User.countDocuments({ role: 'user' });

    const now = new Date();
    const slaBreached = await Ticket.countDocuments({
      slaDeadline: { $lt: now },
      status: { $ne: 'closed' }
    });

    const recentTickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        totalAgents,
        totalUsers,
        slaBreached,
        recentTickets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 4️⃣ Add new Agent
const addAgent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }
    if(!isCorrectEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const agent = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "agent",
    });

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      agent: {
        _id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// 5️⃣ Get all Agents
const getAllAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' }).select('-password');
    res.status(200).json({ success: true, count: agents.length, agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6️⃣ Get Agent by ID
const getAgentById = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await User.findOne({ _id: id, role: 'agent' }).select('-password');
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    res.status(200).json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7️⃣ Update Agent info
const updateAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    // Collect only provided fields
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const agent = await User.findOneAndUpdate(
      { _id: id, role: "agent" },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Agent updated successfully.",
      agent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8️⃣ Delete Agent
const deleteAgent = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await User.findOneAndDelete({ _id: id, role: 'agent' });
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    res.status(200).json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerAdmin,
  assignTicketToAgent,
  getDashboard,
  addAgent,
  getAllAgents,
  getAgentById,
  updateAgent,
  deleteAgent
};
