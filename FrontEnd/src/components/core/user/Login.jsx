import { useState } from 'react';
import { Alert, Button, Form, Input, Tooltip, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faArrowRight, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../helpers/core/AuthContext';
import { getApiError } from '../../../helpers/core/Api';

const DEMO_CREDENTIALS = { email: 'test@meblabs.com', password: 'testtest' };

const Login = () => {
  const { signIn } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fillDemo = () => {
    form.setFields([
      { name: 'email', value: DEMO_CREDENTIALS.email, errors: [] },
      { name: 'password', value: DEMO_CREDENTIALS.password, errors: [] }
    ]);
    setError('');
  };
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
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            initialValues={{ email: DEMO_CREDENTIALS.email }}
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
            <div className="demo-note-heading">
              <strong>Explore the demo</strong>
              <Tooltip title="Fill demo credentials">
                <Button
                  className="demo-fill-button"
                  type="text"
                  htmlType="button"
                  aria-label="Fill demo credentials"
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
        <span className="login-caption">A simple daily expense & income diary.</span>
      </section>
    </main>
  );
};
export default Login;
