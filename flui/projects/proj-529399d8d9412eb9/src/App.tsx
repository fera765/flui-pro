import React from 'react';
import TodoList from './components/TodoList';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Flui Project</h1>
        <TodoList />
      </header>
    </div>
  );
}

export default App;