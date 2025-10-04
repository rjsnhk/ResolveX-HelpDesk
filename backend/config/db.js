const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.MONGO_URI;

const connectDatabase = async () => {
    try {
        await mongoose.connect(URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅ HelpDesk Mini Database connected successfully`);
    } catch (error) {
        console.log(`❌ Error connecting to HelpDesk Mini Database: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDatabase;
