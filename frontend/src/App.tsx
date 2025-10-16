import { useState } from 'react';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>📊 Reporting & Analytics Dashboard</h1>
      </header>
      <Dashboard />
    </div>
  );
}

export default App;
