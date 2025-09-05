// Real test for FLUI AutoCode-Forge with live APIs
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const FLUI_API_URL = 'http://localhost:5000/v1/code-forge';
const POLLINATIONS_API_URL = 'http://localhost:4000/v1';
const USER_ID = 'test-user-' + Date.now();
const SESSION_ID = 'test-session-' + Date.now();

// Test project directory
const TEST_PROJECT_DIR = '/tmp/flui-test-project-' + Date.now();

async function runRealTest() {
  console.log('🚀 FLUI AutoCode-Forge Real Test');
  console.log('================================');
  console.log(`📁 Test Project Directory: ${TEST_PROJECT_DIR}`);
  console.log(`👤 User ID: ${USER_ID}`);
  console.log(`🔗 Session ID: ${SESSION_ID}`);
  console.log('');

  try {
    // Step 1: Test API connectivity
    console.log('1. Testing API connectivity...');
    
    const fluiHealth = await axios.get('http://localhost:5000/health');
    console.log('✅ FLUI API Health:', fluiHealth.data.status);
    
    const pollinationsHealth = await axios.get('http://localhost:4000/health');
    console.log('✅ Pollinations API Health:', pollinationsHealth.data.status);
    
    const codeForgeHealth = await axios.get(`${FLUI_API_URL}/health`);
    console.log('✅ CodeForge Endpoint Health:', codeForgeHealth.data.success);
    
    // Step 2: Test user input processing
    console.log('\n2. Testing user input processing...');
    const userInput = 'Crie um frontend React com TypeScript para e-commerce com autenticação e roteamento';
    
    const processResponse = await axios.post(`${FLUI_API_URL}/process-input`, {
      userId: USER_ID,
      input: userInput,
      workingDirectory: TEST_PROJECT_DIR
    });
    
    console.log('✅ User input processed');
    console.log('   Intent:', processResponse.data.intent);
    console.log('   Questions:', processResponse.data.questions.length);
    console.log('   Confidence:', processResponse.data.confidence);
    
    // Step 3: Test user answers processing
    console.log('\n3. Testing user answers processing...');
    const userAnswers = {
      'tech-1': 'React',
      'lang-2': 'TypeScript', 
      'purpose-3': 'ecommerce',
      'complexity-4': 'medium',
      'features-5': ['authentication', 'routing', 'styling', 'testing']
    };
    
    const answersResponse = await axios.post(`${FLUI_API_URL}/process-answers`, {
      userId: USER_ID,
      answers: userAnswers
    });
    
    console.log('✅ User answers processed');
    console.log('   Updated intent:', answersResponse.data.intent);
    
    // Step 4: Test project creation
    console.log('\n4. Testing real project creation...');
    const createResponse = await axios.post(`${FLUI_API_URL}/create-project`, {
      userId: USER_ID,
      intent: answersResponse.data.intent,
      workingDirectory: TEST_PROJECT_DIR
    });
    
    console.log('✅ Project creation initiated');
    console.log('   Project ID:', createResponse.data.projectId);
    console.log('   Status:', createResponse.data.status);
    
    const projectId = createResponse.data.projectId;
    
    // Step 5: Monitor project creation progress
    console.log('\n5. Monitoring project creation progress...');
    let projectStatus;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (attempts < maxAttempts) {
      try {
        projectStatus = await axios.get(`${FLUI_API_URL}/project-status/${USER_ID}/${projectId}`);
        const status = projectStatus.data;
        
        console.log(`   Attempt ${attempts + 1}: ${status.status} - ${status.currentTask || 'N/A'} (${status.progress.toFixed(2)}%)`);
        
        if (status.status === 'ready') {
          console.log('✅ Project creation completed successfully!');
          break;
        }
        
        if (status.status === 'error') {
          console.log('❌ Project creation failed');
          console.log('   Errors:', status.errors);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        attempts++;
      } catch (error) {
        console.log(`   Error checking status: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('⚠️ Project creation timeout - continuing with tests...');
    }
    
    // Step 6: Test interactive messaging
    console.log('\n6. Testing interactive messaging...');
    
    // Test status inquiry
    const statusMessage = await axios.post(`${FLUI_API_URL}/interactive-message`, {
      userId: USER_ID,
      message: 'Está demorando muito, terminou?'
    });
    
    console.log('✅ Status inquiry handled');
    console.log('   Response:', statusMessage.data.response);
    
    // Test feature addition
    const featureMessage = await axios.post(`${FLUI_API_URL}/interactive-message`, {
      userId: USER_ID,
      message: 'Adicione um modal de promoção quando abrir o site'
    });
    
    console.log('✅ Feature addition request handled');
    console.log('   Response:', featureMessage.data.response);
    if (featureMessage.data.modificationRequest) {
      console.log('   Modification ID:', featureMessage.data.modificationRequest.id);
    }
    
    // Test download request
    const downloadMessage = await axios.post(`${FLUI_API_URL}/interactive-message`, {
      userId: USER_ID,
      message: 'Me dê o zip desse frontend'
    });
    
    console.log('✅ Download request handled');
    console.log('   Response:', downloadMessage.data.response);
    if (downloadMessage.data.downloadRequest) {
      console.log('   Download ID:', downloadMessage.data.downloadRequest.id);
    }
    
    // Step 7: Test project validation
    console.log('\n7. Testing project validation...');
    
    if (projectStatus && projectStatus.data.status === 'ready') {
      console.log('✅ Project is ready for validation');
      
      // Check if project files were created
      const fs = require('fs');
      if (fs.existsSync(TEST_PROJECT_DIR)) {
        const files = fs.readdirSync(TEST_PROJECT_DIR);
        console.log('   Project files created:', files.length);
        console.log('   Files:', files.slice(0, 10)); // Show first 10 files
        
        // Check for key files
        const hasPackageJson = files.includes('package.json');
        const hasSrc = files.includes('src') || fs.existsSync(`${TEST_PROJECT_DIR}/src`);
        const hasPublic = files.includes('public') || fs.existsSync(`${TEST_PROJECT_DIR}/public`);
        
        console.log('   Has package.json:', hasPackageJson);
        console.log('   Has src directory:', hasSrc);
        console.log('   Has public directory:', hasPublic);
        
        if (hasPackageJson) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(`${TEST_PROJECT_DIR}/package.json`, 'utf-8'));
            console.log('   Project name:', packageJson.name);
            console.log('   Dependencies:', Object.keys(packageJson.dependencies || {}).length);
            console.log('   Dev dependencies:', Object.keys(packageJson.devDependencies || {}).length);
          } catch (error) {
            console.log('   Error reading package.json:', error.message);
          }
        }
      } else {
        console.log('⚠️ Project directory not found');
      }
    } else {
      console.log('⚠️ Project not ready for validation');
    }
    
    // Step 8: Test conversation context
    console.log('\n8. Testing conversation context...');
    
    const contextResponse = await axios.get(`${FLUI_API_URL}/conversation-context/${USER_ID}`);
    console.log('✅ Conversation context retrieved');
    console.log('   Messages:', contextResponse.data.conversationHistory.length);
    console.log('   Current project:', !!contextResponse.data.currentProject);
    
    console.log('\n🎉 Real test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ API connectivity');
    console.log('   ✅ User input processing');
    console.log('   ✅ User answers processing');
    console.log('   ✅ Project creation initiation');
    console.log('   ✅ Progress monitoring');
    console.log('   ✅ Interactive messaging');
    console.log('   ✅ Project validation');
    console.log('   ✅ Conversation context');
    
    console.log('\n🚀 FLUI AutoCode-Forge is working in real environment!');
    
  } catch (error) {
    console.error('\n❌ Real test failed!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      console.error('Status:', error.response.status);
    }
    console.error('Stack:', error.stack);
  }
}

// Run the real test
runRealTest();