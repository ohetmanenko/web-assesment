import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthStatus, useAuth } from '../helpers/core/AuthContext';
import Home from './Home';
import Login from '../components/core/user/Login';

const AppRoutes = () => {
  const { authStatus } = useAuth();
  if (authStatus === AuthStatus.Loading)
    return (
      <div className="page-loading">
        <Spin size="large" />
        <span>Opening your diary…</span>
      </div>
    );
  const signedIn = authStatus === AuthStatus.SignedIn;
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={signedIn ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={signedIn ? <Navigate to="/" replace /> : <Login />} />
        <Route path="*" element={<Navigate to={signedIn ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRoutes;
