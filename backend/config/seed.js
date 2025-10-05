const mongoose = require('mongoose');
const User = require('./models/User');
const Ticket = require('./models/Ticket');
const Comment = require('./models/Comment');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/helpdesk', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await Comment.deleteMany({});

    // Create users
    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'agent'
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'user'
      }
    ]);

    console.log('Users created:', users.length);

    // Create tickets
    const tickets = await Ticket.insertMany([
      {
        title: 'Login Issue',
        description: 'Cannot login to the system with my credentials',
        status: 'open',
        createdBy: users[0]._id,
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        timeline: [{
          action: 'created',
          user: users[0]._id,
          details: 'Ticket created'
        }]
      },
      {
        title: 'Password Reset',
        description: 'Need to reset my password for the account',
        status: 'in_progress',
        createdBy: users[3]._id,
        assignedTo: users[1]._id,
        slaDeadline: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (breached)
        timeline: [
          {
            action: 'created',
            user: users[3]._id,
            details: 'Ticket created'
          },
          {
            action: 'assigned',
            user: users[1]._id,
            details: 'Ticket assigned to agent'
          }
        ]
      },
      {
        title: 'Feature Request',
        description: 'Would like to request a new feature for the dashboard',
        status: 'resolved',
        createdBy: users[0]._id,
        assignedTo: users[1]._id,
        slaDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        timeline: [
          {
            action: 'created',
            user: users[0]._id,
            details: 'Ticket created'
          },
          {
            action: 'assigned',
            user: users[1]._id,
            details: 'Ticket assigned to agent'
          },
          {
            action: 'resolved',
            user: users[1]._id,
            details: 'Ticket marked as resolved'
          }
        ]
      }
    ]);

    console.log('Tickets created:', tickets.length);

    // Create comments
    const comments = await Comment.insertMany([
      {
        ticket: tickets[0]._id,
        user: users[1]._id,
        text: 'I can help you with the login issue. Can you provide more details about the error message?',
        createdAt: new Date()
      },
      {
        ticket: tickets[1]._id,
        user: users[1]._id,
        text: 'Password reset link has been sent to your email.',
        createdAt: new Date()
      },
      {
        ticket: tickets[1]._id,
        user: users[3]._id,
        text: 'Thank you! I received the email and reset my password successfully.',
        createdAt: new Date()
      },
      {
        ticket: tickets[2]._id,
        user: users[1]._id,
        text: 'This feature request has been implemented and will be available in the next release.',
        createdAt: new Date()
      }
    ]);

    console.log('Comments created:', comments.length);
    console.log('Database seeded successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedData();
});
