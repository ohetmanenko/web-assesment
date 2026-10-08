import { Col, Row, Skeleton } from 'antd';

const TransactionFormSkeleton = () => (
  <div className="form-skeleton" role="status" aria-label="Loading transaction form">
    <span className="sr-only">Loading transaction form and categories…</span>
    <div aria-hidden="true">
      <Skeleton active title={{ width: '30%' }} paragraph={false} />
      <Skeleton.Input active size="large" block />
      <Row gutter={20}>
        {[0, 1].map(key => (
          <Col xs={24} sm={12} key={key}>
            <Skeleton active title={{ width: '45%' }} paragraph={false} />
            <Skeleton.Input active size="large" block />
          </Col>
        ))}
      </Row>
      <Skeleton active title={{ width: '25%' }} paragraph={false} />
      <Skeleton.Input active size="large" block />
      <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 3, width: '100%' }} />
    </div>
  </div>
);
export default TransactionFormSkeleton;
