import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchStats, fetchCategoryStats, fetchOrderStats } from '../services/api';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [orderStats, setOrderStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, categories, orders] = await Promise.all([
        fetchStats(),
        fetchCategoryStats(),
        fetchOrderStats()
      ]);
      setStats(statsData);
      setCategoryStats(categories);
      setOrderStats(orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <h3>Total Products</h3>
          <div className="stat-value">{stats.totalProducts}</div>
        </div>
        <div className="stat-card success">
          <h3>Total Customers</h3>
          <div className="stat-value">{stats.totalCustomers}</div>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <div className="stat-value">{stats.totalOrders}</div>
        </div>
        <div className="stat-card success">
          <h3>Total Revenue</h3>
          <div className="stat-value">${stats.totalRevenue}</div>
        </div>
        <div className="stat-card warning">
          <h3>Pending Orders</h3>
          <div className="stat-value">{stats.pendingOrders}</div>
        </div>
        <div className="stat-card danger">
          <h3>Low Stock Items</h3>
          <div className="stat-value">{stats.lowStockProducts}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Products by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Products" fill="#3b82f6" />
              <Bar dataKey="totalStock" name="Total Stock" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Orders by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="status"
              >
                {orderStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [value, props.payload.status]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Revenue by Order Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
            <Legend />
            <Bar dataKey="total" name="Revenue" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;
