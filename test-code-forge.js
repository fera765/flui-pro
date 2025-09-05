const axios = require('axios');

async function testCodeForge() {
  console.log('🧪 Testing FLUI AutoCode-Forge System');
  console.log('=====================================');
  
  try {
    // Test 1: Process user input
    console.log('\n1. Testing user input processing...');
    const inputResponse = await axios.post('http://localhost:3000/v1/code-forge/process-input', {
      input: 'Crie um frontend React para mim',
      userId: 'test-user'
    });
    
    console.log('✅ Input processed successfully');
    console.log('Questions generated:', inputResponse.data.data.questions.length);
    console.log('Confidence:', inputResponse.data.data.confidence);
    
    // Test 2: Process user answers
    console.log('\n2. Testing user answers processing...');
    const answers = {
      'tech-1': 'React',
      'lang-2': 'TypeScript',
      'purpose-3': 'ecommerce',
      'complexity-4': 'medium',
      'features-5': ['authentication', 'routing']
    };
    
    const answersResponse = await axios.post('http://localhost:3000/v1/code-forge/process-answers', {
      answers: answers,
      userId: 'test-user'
    });
    
    console.log('✅ Answers processed successfully');
    console.log('Solution generated:', !!answersResponse.data.data.solution);
    
    // Test 3: Create project
    console.log('\n3. Testing project creation...');
    const projectResponse = await axios.post('http://localhost:3000/v1/code-forge/create-project', {
      intent: {
        domain: 'frontend',
        technology: 'react',
        language: 'typescript',
        purpose: 'ecommerce',
        complexity: 'medium',
        features: ['authentication', 'routing']
      },
      userId: 'test-user'
    });
    
    console.log('✅ Project creation initiated');
    console.log('Success:', projectResponse.data.success);
    
    if (projectResponse.data.data.project) {
      console.log('Project ID:', projectResponse.data.data.project.id);
      console.log('Project Status:', projectResponse.data.data.project.status);
    }
    
    // Test 4: Interactive message
    console.log('\n4. Testing interactive message...');
    const messageResponse = await axios.post('http://localhost:3000/v1/code-forge/interactive-message', {
      message: 'Está demorando muito, terminou?',
      userId: 'test-user'
    });
    
    console.log('✅ Interactive message handled');
    console.log('Response:', messageResponse.data.data.response);
    
    // Test 5: Health check
    console.log('\n5. Testing health check...');
    const healthResponse = await axios.get('http://localhost:3000/v1/code-forge/health');
    
    console.log('✅ Health check passed');
    console.log('Status:', healthResponse.data.data.status);
    
    console.log('\n🎉 All tests passed! FLUI AutoCode-Forge is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
testCodeForge();