import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const EXTENSION_ASYNC_ERROR =
  'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received';

window.addEventListener('unhandledrejection', (event) => {
  const message = event?.reason?.message || String(event?.reason || '');
  if (message.includes(EXTENSION_ASYNC_ERROR)) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  const message = event?.message || '';
  if (message.includes(EXTENSION_ASYNC_ERROR)) {
    event.preventDefault();
  }
});

const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args?.[0]?.message || args?.[0] || '';
  if (typeof message === 'string' && message.includes(EXTENSION_ASYNC_ERROR)) {
    return;
  }
  originalConsoleError(...args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
