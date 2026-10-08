import { useEffect, useState } from 'react';
import { Alert, App, AutoComplete, DatePicker, Form, Input, InputNumber, Modal, Radio, Row, Col } from 'antd';
import dayjs from 'dayjs';
import Api, { getApiError } from '../helpers/core/Api';
import { amountToCents, centsToInput } from '../helpers/transactions';

const TransactionForm = ({ open, record, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const type = Form.useWatch('type', form) || 'expense';

  useEffect(() => {
    if (!open) return;
    setError('');
    form.resetFields();
    form.setFieldsValue(
      record
        ? {
            type: record.type,
            amount: centsToInput(record.amountCents),
            category: record.category,
            date: dayjs(record.date),
            description: record.description
          }
        : { type: 'expense', date: dayjs(), description: '' }
    );
  }, [open, record, form]);

  const submit = async values => {
    setSaving(true);
    setError('');
    const data = {
      type: values.type,
      amountCents: amountToCents(values.amount),
      category: values.category.trim(),
      date: values.date.format('YYYY-MM-DD'),
      description: (values.description || '').trim()
    };
    try {
      const response = record
        ? await Api.patch('/transactions/' + record._id, data)
        : await Api.post('/transactions', data);
      onSaved(response.data);
      message.success(record ? 'Transaction updated.' : 'Transaction added.');
      onClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSaving(false);
    }
  };
  const categories =
    type === 'income'
      ? ['Salary', 'Freelance', 'Investments', 'Gift', 'Other']
      : ['Food & drinks', 'Transport', 'Shopping', 'Home', 'Health', 'Entertainment', 'Other'];

  return (
    <Modal
      title={record ? 'Edit transaction' : 'Add a transaction'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={record ? 'Save changes' : 'Add transaction'}
      confirmLoading={saving}
      cancelButtonProps={{ disabled: saving }}
      closable={!saving}
      maskClosable={!saving}
      keyboard={!saving}
      forceRender
      width={560}
    >
      <p className="muted form-intro">A little detail now makes the bigger picture clearer.</p>
      {error && <Alert type="error" message={error} showIcon className="form-error" />}
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false} disabled={saving}>
        <Form.Item name="type" label="Transaction type" rules={[{ required: true }]}>
          <Radio.Group className="type-radio">
            <Radio.Button value="expense">Expense</Radio.Button>
            <Radio.Button value="income">Income</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Row gutter={20}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Amount (USD)"
              name="amount"
              rules={[
                {
                  validator: (_, value) =>
                    amountToCents(value) !== null
                      ? Promise.resolve()
                      : Promise.reject(new Error('Enter $0.01–$9,999,999.99 with at most 2 decimals.'))
                }
              ]}
            >
              <InputNumber
                stringMode
                prefix="$"
                min="0.01"
                max="9999999.99"
                placeholder="0.00"
                className="full-width"
                size="large"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Choose a date.' }]}>
              <DatePicker
                format="MMM D, YYYY"
                className="full-width"
                size="large"
                allowClear={false}
                disabledDate={date => date.year() < 1900 || date.year() > 9999}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label="Category"
          name="category"
          rules={[{ required: true, whitespace: true, message: 'Enter a category.' }, { max: 64 }]}
        >
          <AutoComplete
            size="large"
            options={categories.map(value => ({ value }))}
            placeholder="Choose or enter a category"
            filterOption={(input, option) => option.value.toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <Form.Item
          label={
            <span>
              Description <span className="optional-label">optional</span>
            </span>
          }
          name="description"
        >
          <Input.TextArea rows={3} maxLength={500} showCount placeholder="What was this for?" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
export default TransactionForm;
