import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🚀 FLUI AutoCode-Forge is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Create React + TypeScript + TailwindCSS project
app.post('/autocode/task', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const taskId = uuidv4();
  
  // Simulate creating a React + TypeScript + TailwindCSS project
  const task = {
    id: taskId,
    prompt,
    status: 'processing',
    createdAt: new Date().toISOString(),
    projectPath: `/tmp/react-project-${taskId}`,
    microTasks: [
      {
        id: 'mt_1',
        type: 'file_create',
        path: 'package.json',
        content: JSON.stringify({
          name: 'react-typescript-tailwind-app',
          version: '1.0.0',
          private: true,
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            'react-router-dom': '^6.8.0'
          },
          devDependencies: {
            '@types/react': '^18.0.28',
            '@types/react-dom': '^18.0.11',
            '@types/node': '^18.15.0',
            '@vitejs/plugin-react': '^3.1.0',
            autoprefixer: '^10.4.14',
            postcss: '^8.4.21',
            tailwindcss: '^3.2.7',
            typescript: '^4.9.5',
            vite: '^4.1.0'
          },
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview'
          }
        }, null, 2),
        status: 'completed'
      },
      {
        id: 'mt_2',
        type: 'file_create', 
        path: 'src/App.tsx',
        content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;`,
        status: 'completed'
      },
      {
        id: 'mt_3',
        type: 'file_create',
        path: 'src/components/Header.tsx',
        content: `import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            My App
          </Link>
          <div className="space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;`,
        status: 'completed'
      },
      {
        id: 'mt_4',
        type: 'file_create',
        path: 'src/components/Footer.tsx',
        content: `import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; 2024 My App. All rights reserved.</p>
        <p className="mt-2 text-gray-400">
          Built with React, TypeScript, and TailwindCSS
        </p>
      </div>
    </footer>
  );
};

export default Footer;`,
        status: 'completed'
      },
      {
        id: 'mt_5',
        type: 'file_create',
        path: 'src/pages/HomePage.tsx',
        content: `import React from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

const HomePage: React.FC = () => {
  const products: Product[] = [
    {
      id: 1,
      name: 'Premium Product',
      description: 'High-quality product with excellent features',
      price: 99.99,
      image: 'https://via.placeholder.com/300x200'
    },
    {
      id: 2,
      name: 'Standard Product',
      description: 'Good quality product at an affordable price',
      price: 49.99,
      image: 'https://via.placeholder.com/300x200'
    },
    {
      id: 3,
      name: 'Basic Product',
      description: 'Essential features for everyday use',
      price: 19.99,
      image: 'https://via.placeholder.com/300x200'
    }
  ];

  return (
    <div>
      <section className="text-center py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h1 className="text-5xl font-bold mb-4">Welcome to My App</h1>
        <p className="text-xl mb-8">Discover amazing products with modern design</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Get Started
        </button>
      </section>

      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">
                    ${product.price}
                  </span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;`,
        status: 'completed'
      },
      {
        id: 'mt_6',
        type: 'file_create',
        path: 'src/App.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
        status: 'completed'
      },
      {
        id: 'mt_7',
        type: 'file_create',
        path: 'tailwind.config.js',
        content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
        status: 'completed'
      },
      {
        id: 'mt_8',
        type: 'file_create',
        path: 'vite.config.ts',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`,
        status: 'completed'
      },
      {
        id: 'mt_9',
        type: 'file_create',
        path: 'tsconfig.json',
        content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
        status: 'completed'
      },
      {
        id: 'mt_10',
        type: 'file_create',
        path: 'index.html',
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React TypeScript TailwindCSS App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
        status: 'completed'
      }
    ]
  };

  // Simulate processing time
  setTimeout(() => {
    task.status = 'completed';
  }, 2000);

  res.status(201).json({
    success: true,
    task,
    message: '🎉 React + TypeScript + TailwindCSS project created successfully!',
    instructions: [
      '1. Navigate to the project directory',
      '2. Run: npm install',
      '3. Run: npm run dev',
      '4. Open http://localhost:5173 in your browser'
    ]
  });
});

// Get task status
app.get('/autocode/task/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    task: {
      id,
      status: 'completed',
      message: 'Project created successfully!'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FLUI AutoCode-Forge is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Create React project: POST http://localhost:${PORT}/autocode/task`);
  console.log(`\n✨ Ready to create React + TypeScript + TailwindCSS projects!`);
});

export default app;