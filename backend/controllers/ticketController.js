const Ticket = require('../models/ticketModel');
const Comment = require('../models/commentModel');

// ✅ Utility: uniform error formatter
const errorResponse = (field, message, code = 'FIELD_REQUIRED') => ({
  error: { code, field, message }
});

// ✅ Utility: Idempotency check (for POST)
const requestCache = new Map();
const isDuplicateRequest = (key) => {
  if (!key) return false;
  if (requestCache.has(key)) return true;
  requestCache.set(key, Date.now());
  setTimeout(() => requestCache.delete(key), 60000); // auto-expire after 1 min
  return false;
};

// ✅ Create Ticket (POST /api/tickets)
const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    const createdBy = req.user.id;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!title) return res.status(400).json(errorResponse('title', 'Title is required'));
    if (!description) return res.status(400).json(errorResponse('description', 'Description is required'));
    if (!createdBy) return res.status(400).json(errorResponse('user', 'User not found or not logged in'));

    if (isDuplicateRequest(idempotencyKey)) {
      return res.status(409).json({
        error: { code: 'IDEMPOTENT_CONFLICT', message: 'Duplicate request detected' }
      });
    }

    // SLA = 24 hours
    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + 24);

    const ticket = new Ticket({
      title,
      description,
      createdBy,
      slaDeadline,
      timeline: [{ action: 'created', user: createdBy, details: 'Ticket created' }]
    });

    await ticket.save();
    await ticket.populate('createdBy', 'name email role');

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ✅ Get all tickets (GET /api/tickets?limit=&offset=&search=)

const getAllTickets = async (req, res) => {
  try {
    const { search, status, limit = 10, offset = 0 } = req.query;
    const userId = req.user.id;
    const role = req.user.role;

    const filter = {};

    // Role-based access
    if (role === 'user') filter.createdBy = userId;
    if (role === 'agent') filter.assignedTo = userId;

    // Search: title, description, timeline.details, latest comment
    if (search) {
      const commentTickets = await Comment.find({
        text: { $regex: search, $options: 'i' }
      }).distinct('ticket');

      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'timeline.details': { $regex: search, $options: 'i' } },
        { _id: { $in: commentTickets } }
      ];
    }

    if (status) filter.status = status;

    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await Ticket.countDocuments(filter);

    res.json({
      items: tickets,
      next_offset: Number(offset) + tickets.length,
      total
    });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ✅ Get Ticket by ID (GET /api/tickets/:id)
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('timeline.user', 'name email role');

    if (!ticket) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }

    const comments = await Comment.find({ ticket: ticket._id })
      .populate('user', 'name email role')
      .populate('parentComment')
      .sort({ createdAt: 1 });

    res.json({ ticket, comments });
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ✅ Optimistic Locking Update (PATCH /api/tickets/:id)
const updateVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { version, ...updates } = req.body;

    if (version === undefined) {
      return res.status(400).json(errorResponse('version', 'Version is required for PATCH'));
    }

    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: id, version },
      {
        ...updates,
        $inc: { version: 1 },
        $push: {
          timeline: {
            action: 'updated',
            user: req.user.id,
            details: `Updated fields: ${Object.keys(updates).join(', ')}`
          }
        }
      },
      { new: true }
    )
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!updatedTicket) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Stale version — please refresh and try again.'
        }
      });
    }

    res.json(updatedTicket);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ✅ Add Comment (POST /api/tickets/:id/comments)
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parentComment } = req.body;

    if (!text) return res.status(400).json(errorResponse('text', 'Comment text required'));

    const comment = new Comment({
      ticket: id,
      user: req.user.id,
      text,
      parentComment: parentComment || null
    });

    await comment.save();

    // Add to timeline
    await Ticket.findByIdAndUpdate(id, {
      $push: {
        timeline: {
          action: 'commented',
          user: req.user.id,
          details: text.substring(0, 50)
        }
      }
    });

    await comment.populate('user', 'name email role');
    if (parentComment) await comment.populate('parentComment');

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

// ✅ Update Ticket Status (PATCH /api/tickets/:id/status)
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, version } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(errorResponse('status', 'Invalid status'));
    }

    const ticket = await Ticket.findOneAndUpdate(
      { _id: id, version },
      {
        status,
        $inc: { version: 1 },
        $push: {
          timeline: {
            action: 'status_change',
            user: req.user.id,
            details: `Status updated to ${status}`
          }
        }
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Stale version — please refresh and try again.'
        }
      });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateVersion,
  addComment,
  updateTicketStatus
};
