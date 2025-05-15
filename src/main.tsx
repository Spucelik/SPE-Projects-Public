
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Add debugging for SharePoint Embedded components
window.addEventListener('error', (e) => {
  console.error('Global error caught:', e.error || e.message);
});

const root = createRoot(rootElement);
root.render(<App />);
