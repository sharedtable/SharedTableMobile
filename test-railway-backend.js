#!/usr/bin/env node

/**
 * Test script to verify Railway backend is working
 */

const API_URL = 'https://fare-backend-production.up.railway.app/api';

async function testBackend() {
  console.log('🧪 Testing Railway Backend...\n');
  console.log(`API URL: ${API_URL}\n`);

  const tests = [
    {
      name: 'Health Check',
      url: 'https://fare-backend-production.up.railway.app/health',
      expectStatus: 200,
      expectKeys: ['status', 'timestamp']
    },
    {
      name: 'Feed Endpoint',
      url: `${API_URL}/feed/posts?limit=2`,
      expectStatus: 200,
      expectKeys: null // May return empty array or posts
    },
    {
      name: 'Auth Endpoint',
      url: `${API_URL}/auth/status`,
      expectStatus: [200, 401], // Either authenticated or not
      expectKeys: null
    },
    {
      name: 'Dinners Endpoint',
      url: `${API_URL}/dinners/upcoming`,
      expectStatus: [200, 401],
      expectKeys: null
    },
    {
      name: 'Bookings Endpoint',
      url: `${API_URL}/bookings/active`,
      expectStatus: [200, 401],
      expectKeys: null
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    
    try {
      const response = await fetch(test.url, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const expectedStatuses = Array.isArray(test.expectStatus) 
        ? test.expectStatus 
        : [test.expectStatus];

      if (expectedStatuses.includes(response.status)) {
        if (test.expectKeys && response.status === 200) {
          const data = await response.json();
          const hasKeys = test.expectKeys.every(key => key in data);
          
          if (hasKeys) {
            console.log(`✅ PASSED (Status: ${response.status})`);
            passedTests++;
          } else {
            console.log(`❌ FAILED (Missing expected keys)`);
            console.log(`   Expected: ${test.expectKeys.join(', ')}`);
            console.log(`   Received: ${Object.keys(data).join(', ')}`);
            failedTests++;
          }
        } else {
          console.log(`✅ PASSED (Status: ${response.status})`);
          passedTests++;
        }
      } else {
        const text = await response.text();
        console.log(`❌ FAILED`);
        console.log(`   Expected status: ${expectedStatuses.join(' or ')}`);
        console.log(`   Received status: ${response.status}`);
        console.log(`   Response: ${text.substring(0, 100)}...`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ ERROR`);
      console.log(`   ${error.message}`);
      failedTests++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Success Rate: ${Math.round((passedTests / tests.length) * 100)}%`);
  console.log('='.repeat(50));

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Railway backend is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check the backend logs for issues.\n');
  }
}

// Run tests
testBackend().catch(console.error);