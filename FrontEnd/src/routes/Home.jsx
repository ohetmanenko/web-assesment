import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, App, Avatar, Button, Card, Empty, Input, Popconfirm, Segmented, Table, Tag, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faPlus,
  faArrowTrendUp,
  faArrowTrendDown,
  faWallet,
  faPen,
  faTrash,
  faRotateRight,
  faArrowRightFromBracket,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useAuth } from '../helpers/core/AuthContext';
import Api, { getApiError } from '../helpers/core/Api';
import { formatMoney, sortTransactions } from '../helpers/transactions';
import TransactionForm from '../components/TransactionForm';

const Home = () => {
  const { logged, signOut } = useAuth();
  const { message } = App.useApp();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await Api.get('/transactions');
      setRecords(data);
    } catch (error) {
      setLoadError(getApiError(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(
    () =>
      records.reduce(
        (sum, item) => {
          sum[item.type] += item.amountCents;
          return sum;
        },
        { income: 0, expense: 0 }
      ),
    [records]
  );
  const filtered = useMemo(
    () =>
      records.filter(item => {
        const matchesType = type === 'All' || item.type === type.toLowerCase();
        const query = search.trim().toLowerCase();
        return matchesType && (!query || (item.category + ' ' + item.description).toLowerCase().includes(query));
      }),
    [records, search, type]
  );

  const add = () => {
    setEditing(null);
    setOpen(true);
  };
  const edit = record => {
    setEditing(record);
    setOpen(true);
  };
  const saved = record => {
    setRecords(previous => sortTransactions([...previous.filter(item => item._id !== record._id), record]));
  };
  const remove = async record => {
    setDeleting(record._id);
    try {
      await Api.delete('/transactions/' + record._id);
      setRecords(previous => previous.filter(item => item._id !== record._id));
      message.success('Transaction deleted.');
    } catch (error) {
      message.error(getApiError(error));
    } finally {
      setDeleting(null);
    }
  };
  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      message.error(getApiError(error));
    } finally {
      setSigningOut(false);
    }
  };

  const columns = [
    {
      title: 'TRANSACTION',
      key: 'transaction',
      width: 300,
      render: (_, record) => (
        <div className="transaction-cell">
          <span className={'transaction-icon ' + record.type}>
            <FontAwesomeIcon icon={record.type === 'income' ? faArrowTrendUp : faArrowTrendDown} />
          </span>
          <div>
            <strong>{record.category}</strong>
            <span className="transaction-description">{record.description || 'No description'}</span>
          </div>
        </div>
      )
    },
    {
      title: 'DATE',
      dataIndex: 'date',
      width: 160,
      sorter: (a, b) => a.date.localeCompare(b.date),
      render: date => <span className="date-cell">{dayjs(date).format('MMM D, YYYY')}</span>
    },
    {
      title: 'TYPE',
      dataIndex: 'type',
      width: 120,
      render: value => <Tag className={'type-tag ' + value}>{value === 'income' ? 'Income' : 'Expense'}</Tag>
    },
    {
      title: 'AMOUNT',
      dataIndex: 'amountCents',
      align: 'right',
      width: 170,
      sorter: (a, b) => a.amountCents - b.amountCents,
      render: (value, record) => (
        <span className={'amount-cell ' + record.type}>
          {record.type === 'income' ? '+' : '−'}
          {formatMoney(value)}
        </span>
      )
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right',
      width: 112,
      render: (_, record) => (
        <div className="row-actions">
          <Tooltip title="Edit transaction">
            <Button
              type="text"
              aria-label={'Edit ' + record.category}
              onClick={() => edit(record)}
              icon={<FontAwesomeIcon icon={faPen} />}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this transaction?"
            description={record.category + ' · ' + formatMoney(record.amountCents)}
            okText="Delete"
            cancelText="Keep it"
            okButtonProps={{ danger: true, loading: deleting === record._id }}
            onConfirm={() => remove(record)}
          >
            <Button
              type="text"
              danger
              aria-label={'Delete ' + record.category}
              disabled={deleting !== null}
              icon={<FontAwesomeIcon icon={faTrash} />}
            />
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <div className="diary-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/">
            <span className="brand-mark">
              <FontAwesomeIcon icon={faBookOpen} />
            </span>
            <span>Daily Ledger</span>
          </a>
          <div className="header-account">
            <Avatar className="user-avatar">{logged.fullname.charAt(0)}</Avatar>
            <span className="user-name">{logged.fullname}</span>
            <Button
              type="text"
              aria-label="Sign out"
              loading={signingOut}
              onClick={logout}
              icon={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
            >
              <span className="logout-label">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="diary-main">
        <section className="page-heading">
          <div>
            <span className="eyebrow">YOUR MONEY, AT A GLANCE</span>
            <h1>
              Daily diary<span className="heading-dot">.</span>
            </h1>
            <p className="muted">Every entry is a step toward a clearer picture.</p>
          </div>
          <Button type="primary" size="large" icon={<FontAwesomeIcon icon={faPlus} />} onClick={add}>
            Add transaction
          </Button>
        </section>
        <section className="summary-grid" aria-label="All transaction totals">
          {[
            {
              label: 'Total income',
              value: totals.income,
              icon: faArrowTrendUp,
              tone: 'income',
              note: 'Money coming in'
            },
            {
              label: 'Total expenses',
              value: totals.expense,
              icon: faArrowTrendDown,
              tone: 'expense',
              note: 'Money going out'
            },
            {
              label: 'Balance',
              value: totals.income - totals.expense,
              icon: faWallet,
              tone: 'balance',
              note: 'Income minus expenses'
            }
          ].map(item => (
            <Card className={'summary-card ' + item.tone} key={item.label}>
              <div className="summary-top">
                <span>{item.label}</span>
                <span className="summary-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
              </div>
              <strong className="summary-value">{loading && !records.length ? '—' : formatMoney(item.value)}</strong>
              <span className="summary-note">
                {item.note}
                <span>USD</span>
              </span>
            </Card>
          ))}
        </section>
        <section className="transactions-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Transactions <span className="count-pill">{records.length}</span>
              </h2>
              <p className="muted">The little details of your day-to-day.</p>
            </div>
            <Tooltip title="Refresh transactions">
              <Button
                type="text"
                aria-label="Refresh transactions"
                loading={loading}
                onClick={load}
                icon={<FontAwesomeIcon icon={faRotateRight} />}
              />
            </Tooltip>
          </div>
          <div className="table-toolbar">
            <Segmented options={['All', 'Income', 'Expense']} value={type} onChange={setType} />
            <Input
              aria-label="Search transactions"
              placeholder="Search category or description…"
              prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
              value={search}
              onChange={event => setSearch(event.target.value)}
              allowClear
              className="transaction-search"
            />
          </div>
          {loadError && (
            <Alert
              showIcon
              type="error"
              message="Could not load transactions"
              description={loadError}
              className="load-error"
              action={<Button onClick={load}>Try again</Button>}
            />
          )}
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            scroll={{ x: 820 }}
            pagination={{ pageSize: 8, showSizeChanger: false, hideOnSinglePage: true }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    records.length ? 'No transactions match your search.' : 'Your diary starts with the first entry.'
                  }
                >
                  {!records.length && !loadError && (
                    <Button type="primary" onClick={add}>
                      Add your first transaction
                    </Button>
                  )}
                </Empty>
              )
            }}
          />
          <div className="table-footer">
            <span>
              {filtered.length} of {records.length} transactions
            </span>
            <span>All amounts in USD</span>
          </div>
        </section>
        <footer className="diary-footer">
          <span>One day at a time. One entry at a time.</span>
          <span>Daily Ledger</span>
        </footer>
      </main>
      <TransactionForm open={open} record={editing} onClose={() => setOpen(false)} onSaved={saved} />
    </div>
  );
};
export default Home;
