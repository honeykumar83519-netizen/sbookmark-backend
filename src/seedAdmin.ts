
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/linkhive');
        console.log('MongoDB connected');

        const adminEmail = 'admin@sbookmark.link';
        const adminPassword = 'admin123';
        const adminUsername = 'Admin';

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists');
        } else {
            const admin = new User({
                username: adminUsername,
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                bio: 'System Administrator'
            });

            await admin.save();
            console.log('Admin user created successfully');
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
