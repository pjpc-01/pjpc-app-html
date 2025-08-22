#!/usr/bin/env node

/**
 * PocketBase Connection Debug Script
 * 
 * This script helps debug PocketBase connection issues by:
 * 1. Testing basic connectivity
 * 2. Checking authentication
 * 3. Testing collection access
 * 4. Verifying data retrieval
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  pocketbaseUrl: process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://localhost:8090',
  adminEmail: process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456'
};

console.log('🔍 PocketBase Connection Debug Script');
console.log('=====================================');
console.log(`URL: ${config.pocketbaseUrl}`);
console.log(`Admin Email: ${config.adminEmail}`);
console.log('');

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test 1: Basic connectivity
async function testConnectivity() {
  console.log('1. Testing basic connectivity...');
  try {
    const response = await makeRequest(`${config.pocketbaseUrl}/api/health`);
    console.log(`   ✅ Health check passed: ${response.status}`);
    console.log(`   Response:`, response.data);
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
    return false;
  }
  return true;
}

// Test 2: Admin authentication
async function testAuthentication() {
  console.log('\n2. Testing admin authentication...');
  try {
    const response = await makeRequest(`${config.pocketbaseUrl}/api/admins/auth-with-password`, {
      method: 'POST',
      body: {
        identity: config.adminEmail,
        password: config.adminPassword
      }
    });

    if (response.status === 200) {
      console.log('   ✅ Authentication successful');
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      return response.data.token;
    } else {
      console.log(`   ❌ Authentication failed: ${response.status}`);
      console.log(`   Response:`, response.data);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Authentication error: ${error.message}`);
    return null;
  }
}

// Test 3: Collection access
async function testCollections(token) {
  console.log('\n3. Testing collection access...');
  try {
    const response = await makeRequest(`${config.pocketbaseUrl}/api/collections`, {
      headers: {
        'Authorization': token
      }
    });

    if (response.status === 200) {
      console.log('   ✅ Collections access successful');
      const collections = response.data.items || [];
      console.log(`   Found ${collections.length} collections:`);
      
      const requiredCollections = ['students', 'fees_items', 'student_fees'];
      collections.forEach(collection => {
        const isRequired = requiredCollections.includes(collection.name);
        console.log(`   ${isRequired ? '✅' : '  '} ${collection.name}`);
      });
      
      return collections;
    } else {
      console.log(`   ❌ Collections access failed: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.log(`   ❌ Collections error: ${error.message}`);
    return [];
  }
}

// Test 4: Data retrieval
async function testDataRetrieval(token, collections) {
  console.log('\n4. Testing data retrieval...');
  
  const testCollections = [
    { name: 'students', filter: 'status = "active"' },
    { name: 'fees_items', filter: 'status = "active"' },
    { name: 'student_fees', filter: '' }
  ];

  for (const testCollection of testCollections) {
    const collection = collections.find(c => c.name === testCollection.name);
    if (!collection) {
      console.log(`   ⚠️  Collection '${testCollection.name}' not found`);
      continue;
    }

    try {
      const url = `${config.pocketbaseUrl}/api/collections/${testCollection.name}/records?page=1&perPage=5`;
      const response = await makeRequest(url, {
        headers: {
          'Authorization': token
        }
      });

      if (response.status === 200) {
        const count = response.data.totalItems || 0;
        console.log(`   ✅ ${testCollection.name}: ${count} records`);
        
        if (count > 0 && response.data.items) {
          const sample = response.data.items[0];
          console.log(`   Sample record keys: ${Object.keys(sample).join(', ')}`);
        }
      } else {
        console.log(`   ❌ ${testCollection.name}: Failed (${response.status})`);
      }
    } catch (error) {
      console.log(`   ❌ ${testCollection.name}: Error - ${error.message}`);
    }
  }
}

// Test 5: Environment check
function testEnvironment() {
  console.log('\n5. Environment check...');
  
  const envVars = [
    'NEXT_PUBLIC_POCKETBASE_URL',
    'POCKETBASE_ADMIN_EMAIL',
    'POCKETBASE_ADMIN_PASSWORD',
    'NODE_ENV'
  ];

  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: ${varName.includes('PASSWORD') ? '***' : value}`);
    } else {
      console.log(`   ⚠️  ${varName}: Not set`);
    }
  });
}

// Main execution
async function main() {
  try {
    // Test environment
    testEnvironment();
    
    // Test connectivity
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.log('\n❌ Cannot proceed - PocketBase is not accessible');
      process.exit(1);
    }

    // Test authentication
    const token = await testAuthentication();
    if (!token) {
      console.log('\n❌ Cannot proceed - Authentication failed');
      process.exit(1);
    }

    // Test collections
    const collections = await testCollections(token);
    
    // Test data retrieval
    await testDataRetrieval(token, collections);

    console.log('\n✅ Debug script completed successfully!');
    console.log('\nIf all tests passed, the issue might be in the React component or hook logic.');
    console.log('Check the browser console for detailed logs when running the application.');

  } catch (error) {
    console.error('\n❌ Debug script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { testConnectivity, testAuthentication, testCollections, testDataRetrieval };
