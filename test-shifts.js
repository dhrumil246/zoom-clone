// Test emotional shifts endpoint
const { default: fetch } = require('node-fetch');

async function testEmotionalShifts() {
  const currentSentiment = {
    overall: "negative",
    confidence: 0.8,
    emotions: { joy: 0.1, sadness: 0.7, anger: 0.2, fear: 0.0, surprise: 0.0, disgust: 0.0 },
    intensity: "high",
    keywords: ["frustrated", "difficult"],
    reasoning: "Current negative sentiment"
  };

  const previousSentiments = [
    {
      overall: "positive",
      confidence: 0.9,
      emotions: { joy: 0.8, sadness: 0.1, anger: 0.0, fear: 0.0, surprise: 0.1, disgust: 0.0 },
      intensity: "high",
      keywords: ["excited", "great"],
      reasoning: "Previous positive sentiment"
    },
    {
      overall: "neutral",
      confidence: 0.6,
      emotions: { joy: 0.4, sadness: 0.2, anger: 0.1, fear: 0.0, surprise: 0.3, disgust: 0.0 },
      intensity: "medium",
      keywords: ["okay", "progress"],
      reasoning: "Neutral sentiment"
    }
  ];

  try {
    console.log('Testing Emotional Shifts endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/sentiment/emotional-shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentSentiment,
        previousSentiments
      })
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmotionalShifts();