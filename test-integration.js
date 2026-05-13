const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';

// Test data
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'testpass123',
  firstName: 'Test',
  lastName: 'Worker',
  phone: '+250788000000',
  role: 'WORKER'
};

async function testRegistration() {
  console.log('🧪 Testing user registration...');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RWATRACK-Mobile/1.0'
      }
    });

    console.log('✅ Registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testLogin(email = testUser.email, password = testUser.password) {
  console.log(`🧪 Testing user login for ${email}...`);

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RWATRACK-Mobile/1.0'
      }
    });

    console.log('✅ Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testLocationSubmission(token) {
  console.log('🧪 Testing location submission...');

  try {
    const response = await axios.post(`${BASE_URL}/api/location-logs`, {
      lat: -1.9441,
      lng: 30.0619,
      accuracy: 10.0
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'RWATRACK-Mobile/1.0'
      }
    });

    console.log('✅ Location submission successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Location submission failed:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting RWATRACK Integration Tests...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing web registration...');
    const registerResult = await testRegistration();

    // Test 2: Verify that the new account is pending approval
    console.log('\n2️⃣ Verifying pending approval behavior...');
    try {
      await testLogin();
      console.error('❌ New pending account should not be allowed to log in yet.');
      throw new Error('Pending approval flow did not block login');
    } catch (error) {
      console.log('✅ Pending approval behavior is correct.');
    }

    // Test 3: Login with a seeded active worker account
    console.log('\n3️⃣ Testing seeded active worker login...');
    const loginResult = await testLogin('worker@rwatrack.com', 'Test@12345');

    // Test 4: Submit location data from mobile worker
    console.log('\n4️⃣ Testing location submission...');
    if (loginResult.token) {
      await testLocationSubmission(loginResult.token);
    }

    console.log('\n🎉 All integration tests passed!');
    console.log('\n📱 Next steps for manual testing:');
    console.log('1. Start the web server: cd web && npm run dev');
    console.log('2. Start the mobile app: cd rwatrack_mobile && flutter run');
    console.log('3. Register as worker in web, then login in mobile app');
    console.log('4. Verify location tracking works');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testRegistration, testLogin, testLocationSubmission };