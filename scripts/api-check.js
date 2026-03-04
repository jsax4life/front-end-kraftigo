const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load API URL from .env.local
let baseUrl = 'https://api.xn--kraftig-g1a.com';
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_API_URL=(.+)/);
    if (match) baseUrl = match[1].trim();
}

console.log(`\x1b[36m--- Krafitgo Krafts Flow API Check ---\x1b[0m`);
console.log(`Base URL: ${baseUrl}\n`);

let authToken = null;

async function checkEndpoint(name, method, endpoint, payload = null, requireAuth = false) {
    try {
        console.log(`\x1b[33mTesting ${name} (${method} ${endpoint})...\x1b[0m`);
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Krafitgo-Test-Suite'
        };

        if (requireAuth && authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const config = {
            method: method,
            url: `${baseUrl}${endpoint}`,
            headers: headers,
            validateStatus: () => true 
        };
        
        if (payload) config.data = payload;
        
        const start = Date.now();
        const response = await axios(config);
        const duration = Date.now() - start;
        
        const statusColor = response.status >= 200 && response.status < 300 ? '\x1b[32m' : '\x1b[31m';
        console.log(`${statusColor}Status: ${response.status} ${response.statusText}\x1b[0m (${duration}ms)`);
        
        if (response.status === 200 || response.status === 201) {
            const dataPreview = JSON.stringify(response.data).substring(0, 150);
            console.log(`Data: ${dataPreview}${dataPreview.length >= 150 ? '...' : ''}`);
            
            // Capture token if this was a login
            if (endpoint.includes('/auth/login') && response.data.accessToken) {
                authToken = response.data.accessToken;
                console.log(`\x1b[32m✓ Auth token captured!\x1b[0m`);
            }
        } else {
            console.log(`Response: ${JSON.stringify(response.data)}`);
        }
        console.log('');
        return response;
    } catch (error) {
        console.log(`\x1b[31mError testing ${name}: ${error.message}\x1b[0m\n`);
    }
}

async function runTests() {
    console.log(`\x1b[35m[1] PUBLIC ENDPOINTS\x1b[0m`);
    await checkEndpoint('Categories', 'GET', '/api/services/categories');
    await checkEndpoint('Services List', 'GET', '/api/services');

    console.log(`\x1b[35m[2] AUTH FLOW\x1b[0m`);
    const testEmail = `tester_${Math.floor(Math.random() * 10000)}@test.com`;
    const testPassword = 'Password123!';

    // Step A: Registration
    const regResp = await checkEndpoint('Registration', 'POST', '/api/auth/register', {
        email: testEmail,
        password: testPassword,
        role: 'CUSTOMER',
        phone: '08012345678',
        hasAcceptedTerms: true
    });

    // Step B: Login (if registration worked or if we use a known account)
    // Note: If email verification is required, this login will fail unless verification is mocked or disabled on dev
    await checkEndpoint('Login', 'POST', '/api/auth/login', {
        email: testEmail,
        password: testPassword
    });

    console.log(`\x1b[35m[3] KRAFTS FLOW (Authenticated)\x1b[0m`);
    if (!authToken) {
        console.log(`\x1b[31m⚠ Auth token missing. Authenticated tests will likely return 401.\x1b[0m\n`);
    }
    
    await checkEndpoint('My Bookings', 'GET', '/api/bookings/my', null, true);
    await checkEndpoint('My Disputes', 'GET', '/api/disputes/my', null, true);
    await checkEndpoint('My Reviews', 'GET', '/api/reviews/my', null, true);
    await checkEndpoint('My Payments', 'GET', '/api/payments/my', null, true);

    console.log(`\x1b[36m--- Krafts Flow Check Complete ---\x1b[0m`);
}

runTests();
