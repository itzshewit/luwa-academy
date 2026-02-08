import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import StudentDashboard from './components/StudentDashboard';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const App = () => {
  return (
    <div className="app-container">
      <StudentDashboard />
    </div>
  );
};

export default App;