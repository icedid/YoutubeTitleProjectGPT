const { StrictMode } = require('react');
const { createRoot } = require('react-dom/client');
require('./index.css');
const App = require('./App.jsx').default;





createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
