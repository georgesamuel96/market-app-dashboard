import { supabase } from '../lib/supabase';

// Helper to handle Supabase errors
function handleError(error) {
  if (error) {
    throw new Error(error.message || 'An error occurred');
  }
}

// ==================== STATS ====================

export const fetchStats = async () => {
  const [productsResult, customersResult, ordersResult, revenueResult, lowStockResult, pendingResult] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').eq('status', 'completed'),
    supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 30),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

  return {
    totalProducts: productsResult.count || 0,
    totalCustomers: customersResult.count || 0,
    totalOrders: ordersResult.count || 0,
    totalRevenue: totalRevenue.toFixed(2),
    lowStockProducts: lowStockResult.count || 0,
    pendingOrders: pendingResult.count || 0,
  };
};

export const fetchCategoryStats = async () => {
  const { data, error } = await supabase.from('products').select('category, stock');
  handleError(error);

  // Group by category
  const categoryMap = {};
  data.forEach((product) => {
    if (!categoryMap[product.category]) {
      categoryMap[product.category] = { category: product.category, count: 0, totalStock: 0 };
    }
    categoryMap[product.category].count += 1;
    categoryMap[product.category].totalStock += product.stock;
  });

  return Object.values(categoryMap);
};

export const fetchOrderStats = async () => {
  const { data, error } = await supabase.from('orders').select('status, total_amount');
  handleError(error);

  // Group by status
  const statusMap = {};
  data.forEach((order) => {
    if (!statusMap[order.status]) {
      statusMap[order.status] = { status: order.status, count: 0, total: 0 };
    }
    statusMap[order.status].count += 1;
    statusMap[order.status].total += Number(order.total_amount);
  });

  return Object.values(statusMap);
};

// ==================== PRODUCTS ====================

export const fetchProducts = async (params = {}) => {
  let query = supabase.from('products').select('*');

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }
  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.sort === 'price_asc') {
    query = query.order('price', { ascending: true });
  } else if (params.sort === 'price_desc') {
    query = query.order('price', { ascending: false });
  } else if (params.sort === 'stock_asc') {
    query = query.order('stock', { ascending: true });
  } else if (params.sort === 'stock_desc') {
    query = query.order('stock', { ascending: false });
  } else {
    query = query.order('id', { ascending: false });
  }

  const { data, error } = await query;
  handleError(error);
  return data;
};

export const fetchProduct = async (id) => {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  handleError(error);
  return data;
};

export const createProduct = async (productData) => {
  const { data, error } = await supabase.from('products').insert([productData]).select().single();
  handleError(error);
  return data;
};

export const updateProduct = async (id, productData) => {
  const { data, error } = await supabase
    .from('products')
    .update({ ...productData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  handleError(error);
  return data;
};

export const deleteProduct = async (id) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  handleError(error);
  return { message: 'Product deleted successfully' };
};

// ==================== CUSTOMERS ====================

export const fetchCustomers = async (params = {}) => {
  let query = supabase.from('customers').select('*');

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  query = query.order('id', { ascending: false });

  const { data, error } = await query;
  handleError(error);
  return data;
};

export const fetchCustomer = async (id) => {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
  handleError(error);
  return data;
};

export const createCustomer = async (customerData) => {
  const { data, error } = await supabase.from('customers').insert([customerData]).select().single();
  handleError(error);
  return data;
};

export const updateCustomer = async (id, customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .update(customerData)
    .eq('id', id)
    .select()
    .single();
  handleError(error);
  return data;
};

export const deleteCustomer = async (id) => {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  handleError(error);
  return { message: 'Customer deleted successfully' };
};

// ==================== ORDERS ====================

export const fetchOrders = async (params = {}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      customers (name),
      products (name, price)
    `);

  if (params.status) {
    query = query.eq('status', params.status);
  }

  query = query.order('id', { ascending: false });

  const { data, error } = await query;
  handleError(error);

  // Transform to match expected format
  return data.map((order) => ({
    ...order,
    customer_name: order.customers?.name,
    product_name: order.products?.name,
  }));
};

export const fetchOrder = async (id) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (name),
      products (name, price)
    `)
    .eq('id', id)
    .single();
  handleError(error);

  return {
    ...data,
    customer_name: data.customers?.name,
    product_name: data.products?.name,
  };
};

export const createOrder = async (orderData) => {
  // Get product price to calculate total
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price')
    .eq('id', orderData.product_id)
    .single();
  handleError(productError);

  const total_amount = product.price * orderData.quantity;

  const { data, error } = await supabase
    .from('orders')
    .insert([{ ...orderData, total_amount }])
    .select(`
      *,
      customers (name),
      products (name, price)
    `)
    .single();
  handleError(error);

  return {
    ...data,
    customer_name: data.customers?.name,
    product_name: data.products?.name,
  };
};

export const updateOrder = async (id, orderData) => {
  // Get product price to calculate total
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('price')
    .eq('id', orderData.product_id)
    .single();
  handleError(productError);

  const total_amount = product.price * orderData.quantity;

  const { data, error } = await supabase
    .from('orders')
    .update({ ...orderData, total_amount })
    .eq('id', id)
    .select(`
      *,
      customers (name),
      products (name, price)
    `)
    .single();
  handleError(error);

  return {
    ...data,
    customer_name: data.customers?.name,
    product_name: data.products?.name,
  };
};

export const deleteOrder = async (id) => {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  handleError(error);
  return { message: 'Order deleted successfully' };
};
