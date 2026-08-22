import React from 'react';
import ReactDOM from 'react-dom/client';
import { DashboardApp } from './dashboard/DashboardApp';
import { setupBrowserMockFumii } from './mockFumiiApi';
import './styles/tokens.css';

setupBrowserMockFumii();

ReactDOM.createRoot(document.getElementById('root')!).render(<DashboardApp />);
