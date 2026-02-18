const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function createTestBlog() {
    try {
        // 1. Login as Admin
        console.log('🔑 Logging in as admin...');
        const loginRes = await fetch(`${API_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@sbookmark.link',
                password: 'admin123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginData.success) {
            throw new Error(`Login failed: ${loginData.message}`);
        }

        const token = loginData.data.token;
        console.log('✅ Login successful!');

        // 2. Create Blog Post
        console.log('📝 Creating blog post...');
        const blogPost = {
            title: "Welcome to LinkHive 2.0",
            excerpt: "We have upgraded our admin panel with new features and better performance.",
            content: "LinkHive is better than ever. We fixed the admin dashboard, improved security, and enhanced the user experience. This post serves as a test of the new blogging system.",
            image: "https://images.unsplash.com/photo-1499750310159-525446a9a184?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
            category: "technology",
            tags: "update, linkhive, admin"
        };

        const createRes = await fetch(`${API_URL}/blogs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(blogPost)
        });

        const createData = await createRes.json();

        if (createRes.ok) {
            console.log('✅ Blog post created successfully!');
            console.log('Title:', createData.title);
            console.log('ID:', createData._id || createData.id);
        } else {
            console.error('❌ Failed to create blog:', createData);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createTestBlog();
