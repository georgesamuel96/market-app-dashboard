import { useState, useEffect } from 'react';
import { fetchOrders, fetchCustomers, fetchProducts, createOrder, updateOrder, deleteOrder } from '../services/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    quantity: '1',
    status: 'pending'
  });

  useEffect(() => {
    loadOrders();
    loadCustomersAndProducts();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await fetchOrders(params);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomersAndProducts = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        fetchCustomers(),
        fetchProducts()
      ]);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to load customers/products:', err);
    }
  };

  const handleOpenModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customer_id: order.customer_id.toString(),
        product_id: order.product_id.toString(),
        quantity: order.quantity.toString(),
        status: order.status
      });
    } else {
      setEditingOrder(null);
      setFormData({
        customer_id: customers[0]?.id?.toString() || '',
        product_id: products[0]?.id?.toString() || '',
        quantity: '1',
        status: 'pending'
      });
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setFormData({ customer_id: '', product_id: '', quantity: '1', status: 'pending' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        customer_id: parseInt(formData.customer_id, 10),
        product_id: parseInt(formData.product_id, 10),
        quantity: parseInt(formData.quantity, 10),
        status: formData.status
      };

      if (editingOrder) {
        await updateOrder(editingOrder.id, data);
        setSuccess('Order updated successfully');
      } else {
        await createOrder(data);
        setSuccess('Order created successfully');
      }
      handleCloseModal();
      loadOrders();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteOrder(id);
      setSuccess('Order deleted successfully');
      loadOrders();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    return <span className={`badge badge-${status}`}>{status}</span>;
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>Orders</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Order
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="filters">
          <select
            className="form-control filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.product_name}</td>
                    <td>{order.quantity}</td>
                    <td>${order.total_amount.toFixed(2)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenModal(order)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(order.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingOrder ? 'Edit Order' : 'Add Order'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label>Customer</label>
                  <select
                    className="form-control"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Product</label>
                  <select
                    className="form-control"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingOrder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
