// Test script for endpoints
const { spawn } = require('child_process');

console.log('Starting development server...');
const server = spawn('npx', ['next', 'dev'], {
  stdio: 'pipe',
  cwd: process.cwd()
});

server.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // When server is ready, run tests
  if (output.includes('Ready in')) {
    console.log('\n🚀 Server is ready! Testing endpoints...\n');
    setTimeout(() => {
      testEndpoints();
    }, 2000);
  }
});

server.stderr.on('data', (data) => {
  console.error(`Server error: ${data}`);
});

async function testEndpoints() {
  const endpoints = [
    { method: 'GET', url: 'http://localhost:3000/api/sentiment/test', name: 'Sentiment Test' },
    { 
      method: 'POST', 
      url: 'http://localhost:3000/api/sentiment/analyze', 
      name: 'Sentiment Analysis',
      body: { text: 'I am really excited about this project!' }
    },
    { 
      method: 'POST', 
      url: 'http://localhost:3000/api/sentiment/conversation', 
      name: 'Conversation Analysis',
      body: { 
        conversations: [
          {
            text: "Great job on the presentation!",
            speaker: "Alice",
            timestamp: new Date().toISOString()
          },
          {
            text: "Thanks! I'm excited about the feedback.",
            speaker: "Bob", 
            timestamp: new Date().toISOString()
          }
        ]
      }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(endpoint.url, options);
      const data = await response.json();
      
      console.log(`✅ ${endpoint.name}: ${response.status}`);
      console.log(`Response:`, JSON.stringify(data, null, 2));
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
      console.log('---\n');
    }
  }
  
  console.log('🏁 Testing complete!');
  server.kill();
  process.exit(0);
}