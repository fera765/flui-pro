#!/usr/bin/env node

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock OpenAI-compatible API
app.post('/v1/chat/completions', async (req, res) => {
  console.log('🤖 Mock Pollinations API called with:', req.body);
  
  const { messages, model, temperature, max_tokens } = req.body;
  const userMessage = messages[messages.length - 1].content;
  
  // Simulate LLM processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let response;
  
  if (userMessage.includes('Analise o seguinte input')) {
    // Intent extraction
    response = {
      choices: [{
        message: {
          content: JSON.stringify({
            "domain": "frontend",
            "technology": "react",
            "language": "typescript",
            "features": ["dashboard", "authentication", "charts", "reports"],
            "requirements": ["real-time", "pdf-generation"],
            "purpose": "administrative dashboard"
          })
        }
      }]
    };
  } else if (userMessage.includes('Gere até 5 perguntas')) {
    // Questions generation
    response = {
      choices: [{
        message: {
          content: JSON.stringify([
            {
              "id": "ui-framework",
              "text": "Qual framework de UI você prefere?",
              "type": "choice",
              "options": ["Material-UI", "Ant Design", "Chakra UI"]
            },
            {
              "id": "auth-provider",
              "text": "Qual provedor de autenticação?",
              "type": "choice",
              "options": ["Firebase", "Auth0", "Custom JWT"]
            }
          ])
        }
      }]
    };
  } else {
    // Default response
    response = {
      choices: [{
        message: {
          content: JSON.stringify({
            "domain": "unknown",
            "technology": null,
            "language": null,
            "features": [],
            "requirements": [],
            "purpose": null
          })
        }
      }]
    };
  }
  
  console.log('🤖 Mock API Response:', response);
  res.json(response);
});

app.get('/v1/models', (req, res) => {
  res.json({
    data: [
      { id: 'gpt-4', object: 'model' },
      { id: 'gpt-3.5-turbo', object: 'model' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Pollinations API running on http://localhost:${PORT}`);
  console.log('📡 Ready to receive LLM requests!');
});