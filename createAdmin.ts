import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('✅ MongoDB Connected');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@sbookmark.link' });

        if (existingAdmin) {
            console.log('⚠️ Admin user already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Role:', existingAdmin.role);

            // Update to ensure role is admin
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('✅ Updated existing user to admin role');
        } else {
            // Create new admin user
            const admin = await User.create({
                username: 'admin',
                email: 'admin@sbookmark.link',
                password: 'admin123',
                role: 'admin',
                bio: 'System Administrator'
            });

            console.log('✅ Admin user created successfully!');
            console.log('Email:', admin.email);
            console.log('Password: admin123');
            console.log('Role:', admin.role);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdminUser();
