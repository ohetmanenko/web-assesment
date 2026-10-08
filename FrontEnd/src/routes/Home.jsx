import { useDiary } from '../helpers/core/i18n';
import LanguageSelector from '../components/core/controls/LanguageSelector';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  Dropdown,
  Empty,
  Grid,
  Input,
  Modal,
  Pagination,
  Segmented,
  Skeleton,
  Table,
  Tag,
  Tooltip
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBookOpen,
  faPlus,
  faArrowTrendUp,
  faArrowTrendDown,
  faWallet,
  faPen,
  faTrash,
  faEllipsisVertical,
  faSort,
  faRotateRight,
  faArrowRightFromBracket,
  faMagnifyingGlass
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useAuth } from '../helpers/core/AuthContext';
import Api, { getApiError } from '../helpers/core/Api';
import { compareTransactionDates, formatMoney, sortTransactions } from '../helpers/transactions';
import TransactionForm from '../components/TransactionForm';

const sortOptions = [
  { key: 'date:descend', label: 'Newest first' },
  { key: 'date:ascend', label: 'Oldest first' },
  { key: 'amountCents:descend', label: 'Amount: high to low' },
  { key: 'amountCents:ascend', label: 'Amount: low to high' }
];
const compareAmounts = (a, b) => a.amountCents - b.amountCents || compareTransactionDates(a, b);
const formatTimestamp = value => dayjs(value).format('HH:mm:ss');

const Home = () => {
  const { t, i18n } = useDiary();
  const money = cents => formatMoney(cents, i18n.resolvedLanguage);
  const categoryName = useCallback(value => t('category.' + value, { defaultValue: value }), [t]);
  const { logged, signOut } = useAuth();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const mobile = !screens.md;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState({ field: 'date', order: 'descend' });
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
        return (
          matchesType &&
          (!query ||
            (item.category + ' ' + categoryName(item.category) + ' ' + item.description).toLowerCase().includes(query))
        );
      }),
    [records, search, type, categoryName]
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 8)));
  const ordered = useMemo(() => {
    const compare = sorting.field === 'date' ? compareTransactionDates : compareAmounts;
    return [...filtered].sort((a, b) => (sorting.order === 'ascend' ? compare(a, b) : compare(b, a)));
  }, [filtered, sorting]);
  const changeSort = (field, order) => {
    setSorting({ field, order });
    setPage(1);
  };

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
      setDeleteTarget(null);
      message.success(t('Transaction deleted.'));
    } catch (error) {
      message.error(t(getApiError(error)));
    } finally {
      setDeleting(null);
    }
  };
  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      message.error(t(getApiError(error)));
    } finally {
      setSigningOut(false);
    }
  };

  const transactionActions = record => (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: [
          { key: 'edit', label: t('Edit'), icon: <FontAwesomeIcon icon={faPen} /> },
          { key: 'delete', label: t('Delete'), danger: true, icon: <FontAwesomeIcon icon={faTrash} /> }
        ],
        onClick: ({ key }) => (key === 'edit' ? edit(record) : setDeleteTarget(record))
      }}
    >
      <Button
        type="text"
        className="transaction-actions-trigger"
        aria-label={t('Actions for {{category}}', { category: categoryName(record.category) })}
        disabled={deleting !== null}
        icon={<FontAwesomeIcon icon={faEllipsisVertical} />}
      />
    </Dropdown>
  );

  const transactionDate = record => (
    <Tooltip trigger={['hover', 'focus']} title={formatTimestamp(record.createdAt)}>
      <time className="date-cell transaction-date" dateTime={record.date} tabIndex={0}>
        {dayjs(record.date).format(t('format.date'))}
      </time>
    </Tooltip>
  );

  const emptyState = (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        records.length ? t('No transactions match your search.') : t('Your diary starts with the first entry.')
      }
    >
      {!records.length && !loadError && (
        <Button type="primary" onClick={add}>
          {t('Add your first transaction')}
        </Button>
      )}
    </Empty>
  );

  const columns = [
    {
      title: t('TRANSACTION'),
      key: 'transaction',
      width: 300,
      render: (_, record) => (
        <div className="transaction-cell">
          <span className={'transaction-icon ' + record.type}>
            <FontAwesomeIcon icon={record.type === 'income' ? faArrowTrendUp : faArrowTrendDown} />
          </span>
          <div>
            <strong>{categoryName(record.category)}</strong>
            <span className="transaction-description">{record.description || t('No description')}</span>
          </div>
        </div>
      )
    },
    {
      title: t('DATE'),
      dataIndex: 'date',
      width: 160,
      sorter: compareTransactionDates,
      sortOrder: sorting.field === 'date' ? sorting.order : null,
      render: (_, record) => transactionDate(record)
    },
    {
      title: t('TYPE'),
      dataIndex: 'type',
      width: 120,
      render: value => <Tag className={'type-tag ' + value}>{value === 'income' ? t('Income') : t('Expense')}</Tag>
    },
    {
      title: t('AMOUNT'),
      dataIndex: 'amountCents',
      align: 'right',
      width: 170,
      sorter: compareAmounts,
      sortOrder: sorting.field === 'amountCents' ? sorting.order : null,
      render: (value, record) => (
        <span className={'amount-cell ' + record.type}>
          {record.type === 'income' ? '+' : '−'}
          {money(value)}
        </span>
      )
    },
    {
      title: t('ACTIONS'),
      key: 'actions',
      align: 'right',
      width: 80,
      render: (_, record) => transactionActions(record)
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
            <LanguageSelector />
            <Avatar className="user-avatar">{logged.fullname.charAt(0)}</Avatar>
            <span className="user-name">{logged.fullname}</span>
            <Button
              type="text"
              aria-label={t('Sign out')}
              loading={signingOut}
              onClick={logout}
              icon={<FontAwesomeIcon icon={faArrowRightFromBracket} />}
            >
              <span className="logout-label">{t('Sign out')}</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="diary-main">
        <section className="page-heading">
          <div>
            <span className="eyebrow">{t('YOUR MONEY, AT A GLANCE')}</span>
            <h1>
              {t('Daily diary')}
              <span className="heading-dot">.</span>
            </h1>
            <p className="muted">{t('Every entry is a step toward a clearer picture.')}</p>
          </div>
          <Button type="primary" size="large" icon={<FontAwesomeIcon icon={faPlus} />} onClick={add}>
            {t('Add transaction')}
          </Button>
        </section>
        <section className="summary-grid" aria-label={t('All transaction totals')}>
          {[
            {
              label: t('Total income'),
              value: totals.income,
              icon: faArrowTrendUp,
              tone: 'income',
              note: t('Money coming in')
            },
            {
              label: t('Total expenses'),
              value: totals.expense,
              icon: faArrowTrendDown,
              tone: 'expense',
              note: t('Money going out')
            },
            {
              label: t('Balance'),
              value: totals.income - totals.expense,
              icon: faWallet,
              tone: 'balance',
              note: t('Income minus expenses')
            }
          ].map(item => (
            <Card className={'summary-card ' + item.tone} key={item.label}>
              <div className="summary-top">
                <span>{item.label}</span>
                <span className="summary-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </span>
              </div>
              <strong className="summary-value">{loading && !records.length ? '—' : money(item.value)}</strong>
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
                {t('Transactions')}
                <span className="count-pill">{records.length}</span>
              </h2>
              <p className="muted">{t('The little details of your day-to-day.')}</p>
            </div>
            <Tooltip title={t('Refresh transactions')}>
              <Button
                type="text"
                aria-label={t('Refresh transactions')}
                loading={loading}
                onClick={load}
                icon={<FontAwesomeIcon icon={faRotateRight} />}
              />
            </Tooltip>
          </div>
          <div className="table-toolbar">
            <Segmented
              options={['All', 'Income', 'Expense'].map(value => ({ value, label: t(value) }))}
              value={type}
              onChange={value => {
                setType(value);
                setPage(1);
              }}
            />
            <Input
              aria-label={t('Search transactions')}
              placeholder={t('Search category or description…')}
              prefix={<FontAwesomeIcon icon={faMagnifyingGlass} />}
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setPage(1);
              }}
              allowClear
              className="transaction-search"
            />
          </div>
          {loadError && (
            <Alert
              showIcon
              type="error"
              message={t('Could not load transactions')}
              description={t(loadError)}
              className="load-error"
              action={<Button onClick={load}>{t('Try again')}</Button>}
            />
          )}
          {mobile ? (
            <div className="mobile-transactions" aria-busy={loading}>
              <div className="mobile-sort-controls">
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: sortOptions.map(option => ({ ...option, label: t(option.label) })),
                    selectable: true,
                    selectedKeys: [sorting.field + ':' + sorting.order],
                    onClick: ({ key }) => changeSort(...key.split(':'))
                  }}
                >
                  <Button
                    type="text"
                    size="small"
                    aria-label={t('Sort transactions')}
                    disabled={loading || !records.length}
                    icon={<FontAwesomeIcon icon={faSort} />}
                  >
                    {t(sortOptions.find(option => option.key === sorting.field + ':' + sorting.order).label)}
                  </Button>
                </Dropdown>
              </div>
              {loading ? (
                <div role="status" aria-label={t('Loading transactions')}>
                  <span className="sr-only">{t('Loading transactions…')}</span>
                  {[0, 1, 2].map(key => (
                    <div className="transaction-card" key={key} aria-hidden="true">
                      <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 2 }} />
                    </div>
                  ))}
                </div>
              ) : filtered.length ? (
                <>
                  <ul className="transaction-card-list" aria-label={t('Transactions')}>
                    {ordered.slice((currentPage - 1) * 8, currentPage * 8).map(record => (
                      <li className={'transaction-card ' + record.type} key={record._id}>
                        <div className="transaction-card-top">
                          <Tag className={'type-tag ' + record.type}>
                            <FontAwesomeIcon icon={record.type === 'income' ? faArrowTrendUp : faArrowTrendDown} />
                            {record.type === 'income' ? t('Income') : t('Expense')}
                          </Tag>
                          <span className={'amount-cell ' + record.type}>
                            {record.type === 'income' ? '+' : '−'}
                            {money(record.amountCents)}
                          </span>
                          {transactionActions(record)}
                        </div>
                        <div className="transaction-card-category">
                          <strong>{categoryName(record.category)}</strong>
                          {transactionDate(record)}
                        </div>
                        <p className="transaction-card-description">{record.description || t('No description')}</p>
                      </li>
                    ))}
                  </ul>
                  <Pagination
                    current={currentPage}
                    total={filtered.length}
                    pageSize={8}
                    showSizeChanger={false}
                    hideOnSinglePage
                    onChange={setPage}
                    size="small"
                  />
                </>
              ) : (
                emptyState
              )}
            </div>
          ) : (
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={ordered}
              loading={loading}
              scroll={{ x: 820 }}
              sortDirections={['descend', 'ascend', 'descend']}
              onChange={(_, __, sorter, extra) => {
                if (extra.action === 'sort') changeSort(sorter.field, sorter.order);
              }}
              pagination={{
                current: currentPage,
                onChange: setPage,
                pageSize: 8,
                showSizeChanger: false,
                hideOnSinglePage: true
              }}
              locale={{ emptyText: emptyState }}
            />
          )}
          <div className="table-footer">
            <span>
              {t('{{visible}} of {{total}} transactions', { visible: filtered.length, total: records.length })}
            </span>
            <span>{t('All amounts in USD')}</span>
          </div>
        </section>
        <footer className="diary-footer">
          <span>{t('One day at a time. One entry at a time.')}</span>
          <span>Daily Ledger</span>
        </footer>
      </main>
      <TransactionForm open={open} record={editing} onClose={() => setOpen(false)} onSaved={saved} />
      <Modal
        title={t('Delete this transaction?')}
        open={!!deleteTarget}
        onOk={() => remove(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        okText={t('Delete')}
        cancelText={t('Keep it')}
        okButtonProps={{ danger: true }}
        confirmLoading={deleting !== null}
        cancelButtonProps={{ disabled: deleting !== null }}
        closable={deleting === null}
        maskClosable={deleting === null}
        keyboard={deleting === null}
      >
        {deleteTarget && <p>{categoryName(deleteTarget.category) + ' · ' + money(deleteTarget.amountCents)}</p>}
      </Modal>
    </div>
  );
};
export default Home;
