const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: String,
    bio: String,
    avatar: String,
    createdAt: Date,
});

const User = mongoose.model('User', userSchema);

const createAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const existingAdmin = await User.findOne({ email: 'admin@sbookmark.link' });

        if (existingAdmin) {
            console.log('⚠️ Admin user already exists!');
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('✅ Updated to admin role');
        } else {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await User.create({
                username: 'admin',
                email: 'admin@sbookmark.link',
                password: hashedPassword,
                role: 'admin',
                bio: 'System Administrator',
                createdAt: new Date()
            });

            console.log('✅ Admin user created!');
            console.log('Email: admin@sbookmark.link');
            console.log('Password: admin123');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createAdminUser();
