import { useDiary } from '../../../helpers/core/i18n';
import LanguageSelector from '../controls/LanguageSelector';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Form, Input, Tooltip, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faArrowRight, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../helpers/core/AuthContext';
import { getApiError } from '../../../helpers/core/Api';

const DEMO_CREDENTIALS = { email: 'test@meblabs.com', password: 'testtest' };

const Login = () => {
  const { t, i18n } = useDiary();
  const { signIn } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const names = form
      .getFieldsError()
      .filter(field => field.errors.length)
      .map(field => field.name);
    if (names.length) form.validateFields(names).catch(() => {});
  }, [form, i18n.resolvedLanguage]);
  const fillDemo = () => {
    form.setFields([
      { name: 'email', value: DEMO_CREDENTIALS.email, errors: [] },
      { name: 'password', value: DEMO_CREDENTIALS.password, errors: [] }
    ]);
    setError('');
  };
  const onFinish = async values => {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      await signIn(values.email, values.password);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };
  return (
    <main className="login-page">
      <section className="login-story">
        <a className="brand" href="/">
          <span className="brand-mark">
            <FontAwesomeIcon icon={faBookOpen} />
          </span>
          <span>Daily Ledger</span>
        </a>
        <div className="login-story-content">
          <span className="eyebrow">{t('A LITTLE CLARITY, EVERY DAY')}</span>
          <h1>
            {t('Your money.')}
            <br />
            {t('Your everyday story.')}
          </h1>
          <p>
            {t(
              'Make room for a calmer relationship with money. Keep your income and expenses together, one entry at a time.'
            )}
          </p>
          <div className="story-entry">
            <span className="story-icon">↗</span>
            <div>
              <strong>{t('Small habits, a clearer picture')}</strong>
              <span>{t('Track today. Understand tomorrow.')}</span>
            </div>
          </div>
        </div>
        <span className="story-footer">{t('Simple by design. Yours by default.')}</span>
      </section>
      <section className="login-panel">
        <LanguageSelector />
        <div className="login-card">
          <span className="eyebrow">{t('YOUR PERSONAL DIARY')}</span>
          <Typography.Title level={2}>{t('Welcome back')}</Typography.Title>
          <p className="muted">{t('Sign in to keep track of the day.')}</p>
          {error && <Alert type="error" showIcon message={t(error)} className="login-error" />}
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            disabled={loading}
            initialValues={{ email: DEMO_CREDENTIALS.email }}
          >
            <Form.Item
              label={t('Email address')}
              name="email"
              rules={[{ required: true, type: 'email', message: t('Enter a valid email address.') }]}
            >
              <Input size="large" autoComplete="username" placeholder="you@example.com" />
            </Form.Item>
            <Form.Item
              label={t('Password')}
              name="password"
              rules={[{ required: true, message: t('Enter your password.') }]}
            >
              <Input.Password size="large" autoComplete="current-password" placeholder={t('Your password')} />
            </Form.Item>
            <Button size="large" type="primary" htmlType="submit" block loading={loading}>
              {t('Sign in')}
              <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </Form>
          <div className="demo-note">
            <div className="demo-note-heading">
              <strong>{t('Explore the demo')}</strong>
              <Tooltip title={t('Fill demo credentials')}>
                <Button
                  className="demo-fill-button"
                  type="text"
                  htmlType="button"
                  aria-label={t('Fill demo credentials')}
                  disabled={loading}
                  onClick={fillDemo}
                  icon={<FontAwesomeIcon icon={faWandMagicSparkles} />}
                />
              </Tooltip>
            </div>
            <span>
              {DEMO_CREDENTIALS.email} <span aria-hidden="true">·</span> {DEMO_CREDENTIALS.password}
            </span>
          </div>
        </div>
        <span className="login-caption">{t('A simple daily expense & income diary.')}</span>
      </section>
    </main>
  );
};
export default Login;
