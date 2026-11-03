import React, { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom"; 

import ProtectedRoute from './components/loginpages/ProtectedRoute.jsx'; 
import Sidebar from './components/Sidebar/Sidebar.jsx';

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      throw error;
    }
  });

const Landing = lazyWithRetry(() => import("./pages/landing.jsx")); 
const Signup = lazyWithRetry(() => import("./components/loginpages/signinCode.jsx"));
const Login = lazyWithRetry(() => import("./components/loginpages/reallogin.jsx"));
const ResetPassword = lazyWithRetry(() => import("./components/loginpages/ResetPassword.jsx"));
const ForgotPassword = lazyWithRetry(() => import("./components/loginpages/ForgotPassword.jsx")); 

const Dashboard = lazyWithRetry(() => import("./components/loginpages/Logout.jsx")); 
const Profile = lazyWithRetry(() => import("./components/Profile/Profile.jsx")); 
const Workspace = lazyWithRetry(() => import("./components/workspace/Workspace.jsx")); 
const Calendar = lazyWithRetry(() => import("./components/Calendar/Calendar.jsx")); 
const Stopwatch = lazyWithRetry(() => import("./components/stopwatch/Stopwatch.jsx"));
const Analytics = lazyWithRetry(() => import("./components/Analytics/Analytics.jsx"));
const Leaderboard = lazyWithRetry(() => import("./pages/Leaderboard"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));

function App() {
  const location = useLocation();
  const path = location.pathname;
  
  const isPublicPage = path === '/' || 
                       path === '/login' || 
                       path === '/signup' || 
                       path === '/forgot-password' || 
                       path.startsWith('/reset-password');

  const pathPart = path.split('/')[1];
  const activePage = pathPart ? pathPart.charAt(0).toUpperCase() + pathPart.slice(1) : '';

  return (
    <>
      {!isPublicPage && <Sidebar activePage={activePage} />}
      <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212', color: '#fff' }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />

          <Route 
            path="/profile" 
            element={<ProtectedRoute><Profile /></ProtectedRoute>} 
          />

          <Route 
            path="/workspace" 
            element={<ProtectedRoute><Workspace /></ProtectedRoute>} 
          />

          <Route 
            path="/calendar" 
            element={<ProtectedRoute><Calendar /></ProtectedRoute>} 
          />
          
          <Route 
            path="/stopwatch" 
            element={<ProtectedRoute><Stopwatch /></ProtectedRoute>} 
          />

          <Route 
            path="/analytics" 
            element={<ProtectedRoute><Analytics /></ProtectedRoute>} 
          />
          
          <Route 
            path="/leaderboard"
            element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} 
          />

          <Route 
            path="/profile/:userId"
            element={<ProtectedRoute><Profile /></ProtectedRoute>} 
          />

          <Route 
            path="/settings"
            element={<ProtectedRoute><Settings /></ProtectedRoute>} 
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;