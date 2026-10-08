import { useState } from 'react';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../helpers/core/AuthContext';
import { getApiError } from '../../../helpers/core/Api';

const Login = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const onFinish = async values => {
    setLoading(true);
    setError('');
    try {
      await signIn(values.email, values.password);
    } catch (err) {
      setError(getApiError(err));
    } finally {
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
          <span className="eyebrow">A LITTLE CLARITY, EVERY DAY</span>
          <h1>
            Your money.
            <br />
            Your everyday story.
          </h1>
          <p>
            Make room for a calmer relationship with money. Keep your income and expenses together, one entry at a time.
          </p>
          <div className="story-entry">
            <span className="story-icon">↗</span>
            <div>
              <strong>Small habits, a clearer picture</strong>
              <span>Track today. Understand tomorrow.</span>
            </div>
          </div>
        </div>
        <span className="story-footer">Simple by design. Yours by default.</span>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">YOUR PERSONAL DIARY</span>
          <Typography.Title level={2}>Welcome back</Typography.Title>
          <p className="muted">Sign in to keep track of the day.</p>
          {error && <Alert type="error" showIcon message={error} className="login-error" />}
          <Form
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{ email: 'test@meblabs.com' }}
          >
            <Form.Item
              label="Email address"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Enter a valid email address.' }]}
            >
              <Input size="large" autoComplete="username" placeholder="you@example.com" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Enter your password.' }]}>
              <Input.Password size="large" autoComplete="current-password" placeholder="Your password" />
            </Form.Item>
            <Button size="large" type="primary" htmlType="submit" block loading={loading}>
              Sign in <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </Form>
          <div className="demo-note">
            <strong>Explore the demo</strong>
            <span>
              test@meblabs.com <span aria-hidden="true">·</span> testtest
            </span>
          </div>
        </div>
        <span className="login-caption">A simple daily expense & income diary.</span>
      </section>
    </main>
  );
};
export default Login;
