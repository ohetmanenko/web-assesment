import { createRoot } from 'react-dom/client';
import { Suspense, useEffect } from 'react';
import { ConfigProvider, App, Spin } from 'antd';
import enUS from 'antd/locale/en_US';
import itIT from 'antd/locale/it_IT';
import { useDiary } from './helpers/core/i18n';
import { AuthContextProvider } from './helpers/core/AuthContext';
import Routes from './routes';
import './styles/style.css';

const LocalizedApp = () => {
  const { t, i18n } = useDiary();
  useEffect(() => {
    document.title = t('Daily Ledger - Expense & Income Diary');
  }, [t]);
  return (
    <ConfigProvider
      locale={i18n.resolvedLanguage === 'it' ? itIT : enUS}
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
};

createRoot(document.getElementById('root')).render(
  <Suspense
    fallback={
      <div className="page-loading">
        <Spin />
      </div>
    }
  >
    <LocalizedApp />
  </Suspense>
);
