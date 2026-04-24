import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './lib/AuthContext';
import { Toaster } from 'react-hot-toast';
import SOSButton from './components/SOSButton';
import PWABanner from './components/PWABanner';

function App() {
  return (
    <AuthProvider>
      <Router>
        <PWABanner />
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route 
              path="/" 
              element={
                <>
                  <Navbar />
                  <Dashboard />
                  <SOSButton />
                </>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;