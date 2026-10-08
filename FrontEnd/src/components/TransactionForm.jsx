import { useEffect, useState } from 'react';
import {
  Alert,
  App,
  AutoComplete,
  Button,
  ConfigProvider,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Col,
  Select
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendDown, faArrowTrendUp, faXmark } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import Api, { getApiError } from '../helpers/core/Api';
import { amountToCents, centsToInput, titleCaseCategory } from '../helpers/transactions';
import TransactionFormSkeleton from './TransactionFormSkeleton';

const TransactionForm = ({ open, record, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [categoryNotice, setCategoryNotice] = useState('');
  const type = Form.useWatch('type', form) || 'expense';
  const category = Form.useWatch('category', form);
  const customName = Form.useWatch('customCategoryName', form) || '';
  const available = selectedType => [
    ...(catalog?.defaults[selectedType] || []),
    ...(catalog?.custom[selectedType] || [])
  ];
  const presets = Object.values(catalog?.defaults || {}).flat();
  const customPreview =
    presets.find(name => name.toLowerCase() === customName.trim().toLowerCase()) || titleCaseCategory(customName);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let active = true;
    setError('');
    setLoadError('');
    setCatalog(null);
    setCategoryLoading(true);
    setCategoryNotice('');
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
    Api.get('/categories', { signal: controller.signal })
      .then(({ data }) => {
        if (!active) return;
        setCatalog(data);
        if (record) {
          const names = [...data.defaults[record.type], ...data.custom[record.type]];
          const normalized = titleCaseCategory(record.category);
          const match = names.find(name => titleCaseCategory(name) === normalized);
          if (match) form.setFieldValue('category', match);
          else {
            form.setFields([{ name: 'category', value: undefined, errors: [] }]);
            setCategoryNotice('Previous category is incompatible with this type. Choose a category to continue.');
          }
        }
      })
      .catch(err => {
        if (active) setLoadError(getApiError(err));
      })
      .finally(() => {
        if (active) setCategoryLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [open, record, reload, form]);

  const changeType = event => {
    setError('');
    const nextType = event.target.value;
    const selected = form.getFieldValue('category');
    const hasCustomName = !!form.getFieldValue('customCategoryName');
    form.setFields([{ name: 'customCategoryName', value: undefined, errors: [] }]);
    if (selected && !available(nextType).includes(selected)) {
      form.setFields([{ name: 'category', value: undefined, errors: [] }]);
      setCategoryNotice('Previous category cleared. Choose an ' + nextType + ' category.');
    } else {
      setCategoryNotice(hasCustomName ? 'Custom name cleared after changing transaction type.' : '');
    }
  };
  const clearCategory = () => {
    setError('');
    form.setFields([
      { name: 'category', value: undefined, errors: [] },
      { name: 'customCategoryName', value: undefined, errors: [] }
    ]);
    setCategoryNotice('');
  };
  const submit = async values => {
    setSaving(true);
    setError('');
    const data = {
      type: values.type,
      amountCents: amountToCents(values.amount),
      category: values.category,
      ...(values.category === 'Other' && values.customCategoryName?.trim()
        ? { customCategoryName: values.customCategoryName.trim() }
        : {}),
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
  const options = [
    { label: 'Suggested categories', options: (catalog?.defaults[type] || []).map(value => ({ value, label: value })) },
    ...(catalog?.custom[type]?.length
      ? [{ label: 'Your categories', options: catalog.custom[type].map(value => ({ value, label: value })) }]
      : [])
  ];
  const nameSuggestions = options
    .map(group => ({ ...group, options: group.options.filter(option => option.value !== 'Other') }))
    .filter(group => group.options.length);

  return (
    <ConfigProvider theme={{ token: { colorPrimary: type === 'income' ? '#176b65' : '#9d5b35' } }}>
      <Modal
        className={'transaction-modal ' + type}
        title={record ? 'Edit transaction' : 'Add a transaction'}
        open={open}
        onCancel={onClose}
        onOk={() => form.submit()}
        okText={record ? 'Save changes' : 'Add transaction'}
        okButtonProps={{ disabled: categoryLoading || !!loadError }}
        confirmLoading={saving}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
        keyboard={!saving}
        forceRender
        width={560}
      >
        <p className="form-intro transaction-direction">
          <FontAwesomeIcon icon={type === 'income' ? faArrowTrendUp : faArrowTrendDown} />
          {type === 'income' ? 'Income · Money coming in' : 'Expense · Money going out'}
        </p>
        {error && <Alert type="error" message={error} showIcon className="form-error" />}
        {loadError && (
          <Alert
            type="error"
            showIcon
            message="Could not load categories"
            description={loadError}
            className="form-error"
            action={<Button onClick={() => setReload(value => value + 1)}>Try again</Button>}
          />
        )}
        <div aria-busy={categoryLoading}>
          {categoryLoading && <TransactionFormSkeleton />}
          <Form
            form={form}
            layout="vertical"
            onFinish={submit}
            requiredMark={false}
            disabled={saving}
            style={{ display: categoryLoading || loadError ? 'none' : undefined }}
          >
            <Form.Item name="type" label="Transaction type" rules={[{ required: true }]}>
              <Radio.Group className="type-radio" buttonStyle="solid" onChange={changeType}>
                <Radio.Button value="expense" className="type-option expense">
                  <FontAwesomeIcon icon={faArrowTrendDown} className="type-option-icon expense" /> Expense
                </Radio.Button>
                <Radio.Button value="income" className="type-option income">
                  <FontAwesomeIcon icon={faArrowTrendUp} className="type-option-icon income" /> Income
                </Radio.Button>
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
            <div className="category-heading">
              <label htmlFor="category">Category</label>
              {category && (
                <Button
                  type="text"
                  size="small"
                  htmlType="button"
                  aria-label="Clear category"
                  icon={<FontAwesomeIcon icon={faXmark} />}
                  disabled={saving}
                  onClick={clearCategory}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className={'category-fields' + (category === 'Other' ? ' with-other' : '')}>
              <Form.Item
                name="category"
                rules={[
                  { required: true, message: 'Choose a category.' },
                  {
                    validator: (_, value) =>
                      !value || available(type).includes(value)
                        ? Promise.resolve()
                        : Promise.reject(new Error('Choose a category for the selected transaction type.'))
                  }
                ]}
                extra={categoryNotice && <span role="status">{categoryNotice}</span>}
              >
                <Select
                  id="category"
                  aria-label="Category"
                  size="large"
                  showSearch
                  options={options}
                  placeholder="Choose a category"
                  optionFilterProp="label"
                  onChange={() => {
                    form.setFields([{ name: 'customCategoryName', value: undefined, errors: [] }]);
                    setCategoryNotice('');
                  }}
                />
              </Form.Item>
              {category === 'Other' && (
                <Form.Item
                  name="customCategoryName"
                  preserve={false}
                  extra={customName.trim() ? 'Saved as: ' + customPreview : 'Optional. Leave blank to save as Other.'}
                  rules={[
                    { max: 64, message: 'Use at most 64 characters.' },
                    {
                      validator: (_, value) => {
                        const name = titleCaseCategory(value || '');
                        const preset = presets.find(item => titleCaseCategory(item) === name);
                        return name.length <= 64 && (!preset || catalog.defaults[type].includes(preset))
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error('Use a name for the selected transaction type, up to 64 characters.')
                            );
                      }
                    }
                  ]}
                >
                  <AutoComplete
                    size="large"
                    className="full-width"
                    options={nameSuggestions}
                    filterOption={(input, option) =>
                      !!option.value &&
                      titleCaseCategory(option.value).toLowerCase().includes(titleCaseCategory(input).toLowerCase())
                    }
                  >
                    <Input
                      maxLength={64}
                      placeholder="Other name (optional)"
                      aria-label="Other category name (optional)"
                      autoComplete="off"
                    />
                  </AutoComplete>
                </Form.Item>
              )}
            </div>
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
        </div>
      </Modal>
    </ConfigProvider>
  );
};
export default TransactionForm;
