import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchShop,
  updateShop,
  deleteShop,
  fetchShopProducts,
  fetchProducts,
  addProductToShop,
  removeProductFromShop
} from '../services/api';

function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Edit shop modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  // Add product modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    loadShopData();
  }, [id]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const [shopData, shopProductsData, productsData] = await Promise.all([
        fetchShop(id),
        fetchShopProducts(id),
        fetchProducts()
      ]);
      setShop(shopData);
      setShopProducts(shopProductsData);
      setAllProducts(productsData);
      setFormData({ name: shopData.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateShop(id, formData);
      setShop({ ...shop, name: formData.name });
      setShowEditModal(false);
      setSuccess('Shop updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this shop? This will also remove all product associations.')) return;
    try {
      await deleteShop(id);
      navigate('/shops');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;
    try {
      await addProductToShop(id, selectedProductId);
      const updatedProducts = await fetchShopProducts(id);
      setShopProducts(updatedProducts);
      setShowAddProductModal(false);
      setSelectedProductId('');
      setSuccess('Product added to shop successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!confirm('Are you sure you want to remove this product from the shop?')) return;
    try {
      await removeProductFromShop(id, productId);
      setShopProducts(shopProducts.filter(p => p.product_id !== productId));
      setSuccess('Product removed from shop successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Get available products (not already in shop)
  const availableProducts = allProducts.filter(
    product => !shopProducts.some(sp => sp.product_id === product.id)
  );

  if (loading) {
    return <div className="loading">Loading shop details...</div>;
  }

  if (!shop) {
    return (
      <div className="shop-detail-page">
        <div className="alert alert-error">Shop not found</div>
        <button className="btn btn-secondary" onClick={() => navigate('/shops')}>
          Back to Shops
        </button>
      </div>
    );
  }

  return (
    <div className="shop-detail-page">
      <div className="page-header">
        <div className="header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/shops')}>
            &larr; Back to Shops
          </button>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
            Edit Shop
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Shop
          </button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>{shop.name}</h2>
        <p style={{ color: '#64748b', margin: 0 }}>
          Created: {new Date(shop.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="card">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Products ({shopProducts.length})</h3>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddProductModal(true)}
            disabled={availableProducts.length === 0}
          >
            + Add Product
          </button>
        </div>

        {shopProducts.length === 0 ? (
          <div className="empty-state">
            <h3>No products in this shop</h3>
            <p>Add products to this shop using the button above</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shopProducts.map(product => (
                  <tr key={product.product_id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>${product.price?.toFixed(2)}</td>
                    <td>
                      <span style={{ color: product.stock < 30 ? '#ef4444' : 'inherit' }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveProduct(product.product_id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Shop Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Shop</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Product to Shop</h2>
              <button className="modal-close" onClick={() => setShowAddProductModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Product</label>
                  <select
                    className="form-control"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    <option value="">-- Select a product --</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price?.toFixed(2)} ({product.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProductModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShopDetail;
