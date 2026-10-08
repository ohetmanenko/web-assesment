import { createRoot } from 'react-dom/client';
import { ConfigProvider, App } from 'antd';
import { AuthContextProvider } from './helpers/core/AuthContext';
import Routes from './routes';
import './styles/style.css';

createRoot(document.getElementById('root')).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#176b65',
        borderRadius: 8,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }
    }}
  >
    <App>
      <AuthContextProvider>
        <Routes />
      </AuthContextProvider>
    </App>
  </ConfigProvider>
);
