import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchShopProducts, fetchProducts, addProductToShop, removeProductFromShop } from '../services/api';

function ShopDashboard() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [shopProducts, setShopProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add product modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    // Get shop from session storage
    const sessionShop = sessionStorage.getItem('dashboard_shop');
    if (!sessionShop) {
      navigate('/login/shop');
      return;
    }

    const shopData = JSON.parse(sessionShop);
    setShop(shopData);
    loadShopData(shopData.id);
  }, [navigate]);

  const loadShopData = async (shopId) => {
    try {
      setLoading(true);
      const [shopProductsData, productsData] = await Promise.all([
        fetchShopProducts(shopId),
        fetchProducts()
      ]);
      setShopProducts(shopProductsData);
      setAllProducts(productsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dashboard_shop');
    navigate('/login/shop');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !shop) return;
    try {
      await addProductToShop(shop.id, selectedProductId);
      const updatedProducts = await fetchShopProducts(shop.id);
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
    if (!confirm('Are you sure you want to remove this product from your shop?')) return;
    if (!shop) return;
    try {
      await removeProductFromShop(shop.id, productId);
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
    return <div className="loading">Loading shop dashboard...</div>;
  }

  if (!shop) {
    return null;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <h2>Shop Dashboard</h2>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link active">
            <span className="nav-icon">🏪</span>
            My Shop
          </a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">{shop.email}</span>
            <span className="user-role">SHOP</span>
          </div>
          <button className="btn btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="shop-dashboard-page">
          <div className="page-header">
            <h1>{shop.name}</h1>
          </div>

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>Shop Information</h3>
            <p><strong>Email:</strong> {shop.email}</p>
            {shop.phone && <p><strong>Phone:</strong> {shop.phone}</p>}
            {shop.address && <p><strong>Address:</strong> {shop.address}</p>}
          </div>

          <div className="card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>My Products ({shopProducts.length})</h3>
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
                <h3>No products in your shop</h3>
                <p>Add products to your shop using the button above</p>
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
      </main>
    </div>
  );
}

export default ShopDashboard;
