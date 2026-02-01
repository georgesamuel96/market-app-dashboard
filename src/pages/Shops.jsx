import { useState, useEffect } from 'react';
import { fetchShops, createShop, updateShop, deleteShop } from '../services/api';

function Shops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    loadShops();
  }, [search]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const data = await fetchShops(params);
      setShops(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (shop = null) => {
    if (shop) {
      setEditingShop(shop);
      setFormData({
        name: shop.name
      });
    } else {
      setEditingShop(null);
      setFormData({ name: '' });
    }
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingShop(null);
    setFormData({ name: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShop) {
        await updateShop(editingShop.id, formData);
        setSuccess('Shop updated successfully');
      } else {
        await createShop(formData);
        setSuccess('Shop created successfully');
      }
      handleCloseModal();
      loadShops();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this shop?')) return;
    try {
      await deleteShop(id);
      setSuccess('Shop deleted successfully');
      loadShops();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="shops-page">
      <div className="page-header">
        <h1>Shops</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Shop
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="filters">
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading">Loading shops...</div>
        ) : shops.length === 0 ? (
          <div className="empty-state">
            <h3>No shops found</h3>
            <p>Try adjusting your search or add a new shop</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map(shop => (
                  <tr key={shop.id}>
                    <td>{shop.id}</td>
                    <td>{shop.name}</td>
                    <td>{new Date(shop.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenModal(shop)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(shop.id)}
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
              <h2>{editingShop ? 'Edit Shop' : 'Add Shop'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label>Shop Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingShop ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shops;
