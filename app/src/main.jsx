import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../platform/tokens/rd/yce-frontend-1.34.1/variables.css';
import '../../platform/tokens/rd/yce-frontend-1.34.1/variables-custom.css';
import './styles/global.scss';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
