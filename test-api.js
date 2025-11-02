// Test script to verify WAQI API key
// Run this in browser console (F12) to test your API connection

console.log('🔍 Testing WAQI API Connection...\n');

// Check if API key is loaded
const apiKey = import.meta.env.VITE_WAQI_API_KEY;
console.log('1. API Key loaded:', apiKey ? '✅ Yes' : '❌ No (undefined)');
console.log('   Key preview:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');

if (!apiKey) {
  console.error('\n❌ PROBLEM: VITE_WAQI_API_KEY is not defined!');
  console.log('\n📋 FIX THIS:');
  console.log('1. Check your .env.local file exists in project root');
  console.log('2. Make sure it contains: VITE_WAQI_API_KEY=your_token_here');
  console.log('3. RESTART the dev server after adding .env.local');
  console.log('4. The key MUST start with VITE_ to be accessible in browser\n');
} else {
  // Test API with Beijing (known to have data)
  console.log('\n2. Testing API with Beijing...');
  
  fetch(`https://api.waqi.info/feed/geo:39.9;116.4/?token=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      console.log('   Response status:', data.status);
      
      if (data.status === 'ok') {
        console.log('   ✅ API Working! AQI:', data.data.aqi);
        console.log('   Station:', data.data.city.name);
        console.log('\n✅ SUCCESS: Your WAQI API key is valid and working!\n');
      } else if (data.status === 'error') {
        console.error('   ❌ API Error:', data.data);
        console.log('\n📋 COMMON CAUSES:');
        console.log('1. Invalid API key - Get a new one at: https://aqicn.org/data-platform/token/');
        console.log('2. Rate limit exceeded (1000 requests/day)');
        console.log('3. Key not activated yet (check your email)\n');
      }
    })
    .catch(err => {
      console.error('   ❌ Network Error:', err.message);
      console.log('\n📋 CHECK:');
      console.log('1. Internet connection');
      console.log('2. CORS issues (use API key, not direct URL access)');
      console.log('3. Firewall/proxy settings\n');
    });
}

// Test OpenAQ (if configured)
const openaqKey = import.meta.env.VITE_OPENAQ_API_KEY;
console.log('\n3. OpenAQ Key loaded:', openaqKey ? '✅ Yes' : '⚠️ No (optional)');
