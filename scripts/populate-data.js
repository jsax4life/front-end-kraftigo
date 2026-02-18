const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 1. Load API URL from .env.local
let baseUrl = 'https://api.xn--kraftig-g1a.com';
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
    if (match) baseUrl = match[1].trim();
}

console.log(`\x1b[36m--- Krafitgo Data Population Script ---\x1b[0m`);
console.log(`Base URL: ${baseUrl}\n`);

async function run() {
    try {
        const testEmail = '';
        const testPassword = '';
        let token = null;

        // Step 1: Login
        console.log(`\x1b[33m[1] Logging In with Verified Account (${testEmail})...\x1b[0m`);
        const loginResp = await axios.post(`${baseUrl}/api/auth/login`, {
            email: testEmail,
            password: testPassword
        });
        token = loginResp.data.accessToken;
        console.log(`\x1b[32mLogged in! Token captured.\x1b[0m\n`);

        // Step 2: Fetch Categories
        console.log(`\x1b[33m[2] Fetching Service Categories...\x1b[0m`);
        let categories = [];
        try {
            const catResp = await axios.get(`${baseUrl}/api/services/categories`);
            categories = catResp.data;
            console.log(`Fetched ${categories.length} categories.`);
        } catch (err) {
            console.log(`\x1b[31mFetching categories failed. Error: ${err.message}\x1b[0m`);
            if (err.response) {
                console.log(`Details: ${JSON.stringify(err.response.data)}`);
            }
        }
        
        if (!Array.isArray(categories) || categories.length === 0) {
            console.log(`\x1b[31mWarning: Falling back to static category list.\x1b[0m`);
            categories = [
                { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Home Cleaning' },
                { id: '6b26d83a-4416-43b9-8e43-e699d7a2202c', name: 'Laundry' }
            ];
        }
        
        console.log(`Using categories:`);
        categories.forEach(c => console.log(` - ${c.name} (${c.id || c._id})`));
        console.log('');

        // Step 3: Create 5 Bookings
        console.log(`\x1b[33m[3] Creating 5 Mock Bookings...\x1b[0m`);
        const locations = [
            'Hauptstraße 123, 10115 Berlin',
            '2383 Timber Oak Drive, Lagos',
            '45 Maple Street, Abuja',
            'Side gate, 789 Pine Ave, Berlin',
            'Apartment 4B, 12 Oak Lane'
        ];

        for (let i = 0; i < 5; i++) {
            const category = categories[i % categories.length];
            const catId = category.id || category._id;
            const date = new Date();
            date.setDate(date.getDate() + (i + 1));
            
            const payload = {
                serviceCategoryId: catId,
                jobTitle: `Clean Kraft #${i + 1}`,
                jobDescription: `Mock description for job #${i + 1}. Please ensure thorough work.`,
                consentAcknowledged: true,
                address: locations[i],
                latitude: 52.52,
                longitude: 13.40,
                preferredDate: date.toISOString().split('T')[0],
                preferredTime: "09:00"
            };

            console.log(`Creating booking ${i+1}: "${payload.jobTitle}" for category ${catId}...`);
            try {
                await axios.post(`${baseUrl}/api/bookings`, payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`\x1b[32m✓ Booking #${i+1} created!\x1b[0m`);
            } catch (postErr) {
                console.log(`\x1b[31mFAIL: Booking #${i+1} failed with status ${postErr.response?.status}.\x1b[0m`);
                if (postErr.response) {
                    console.log(`Server Error: ${JSON.stringify(postErr.response.data)}`);
                }
            }
        }

        // Step 4: Verify
        console.log(`\x1b[33m\n[4] Final Verification of "My Bookings"...\x1b[0m`);
        const verifyResp = await axios.get(`${baseUrl}/api/bookings/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`Status: ${verifyResp.status}`);
        console.log(`Items returned: ${Array.isArray(verifyResp.data) ? verifyResp.data.length : 'Not an array'}`);
        if (verifyResp.data && verifyResp.data.length > 0) {
            console.log(`Sample booking ID: ${verifyResp.data[0].id || verifyResp.data[0]._id}`);
        }

        console.log(`\x1b[36m\n--- Population Process Finished ---\x1b[0m`);

    } catch (error) {
        console.error(`\x1b[31mTerminal Error: ${error.message}\x1b[0m`);
        if (error.response) {
            console.error(`Details:`, JSON.stringify(error.response.data, null, 2));
        }
    }
}

run();
