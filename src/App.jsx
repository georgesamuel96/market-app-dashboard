import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Shops from './pages/Shops';
import ShopDetail from './pages/ShopDetail';
import Login from './pages/Login';
import ShopLogin from './pages/ShopLogin';
import ShopDashboard from './pages/ShopDashboard';

function AppLayout({ children }) {
  const { userProfile, signOut } = useAuth();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <h2>DB Dashboard</h2>
        </div>
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📊</span>
            Dashboard
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">📦</span>
            Products
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">👥</span>
            Customers
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">🛒</span>
            Orders
          </NavLink>
          <NavLink to="/shops" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <span className="nav-icon">🏪</span>
            Shops
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          {userProfile && (
            <div className="user-info">
              <span className="user-email">{userProfile.email}</span>
              <span className="user-role">{userProfile.role}</span>
            </div>
          )}
          <button className="btn btn-logout" onClick={signOut}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/admin/login' || location.pathname === '/login/shop';
  const isShopDashboard = location.pathname.startsWith('/shop/');

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/login/shop" element={<ShopLogin />} />
      </Routes>
    );
  }

  if (isShopDashboard) {
    return (
      <Routes>
        <Route path="/shop/dashboard" element={<ShopDashboard />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route path="/login/shop" element={<ShopLogin />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Products />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Customers />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Orders />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Shops />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ShopDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
