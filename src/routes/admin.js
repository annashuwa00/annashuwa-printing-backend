const express = require('express');
const pool = require('../config/database');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard metrics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Get total customers
    const customersResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'customer'"
    );

    // Get total orders
    const ordersResult = await pool.query(
      'SELECT COUNT(*) as count FROM orders'
    );

    // Get pending requests
    const pendingRequestsResult = await pool.query(
      "SELECT COUNT(*) as count FROM service_requests WHERE status = 'pending'"
    );

    // Get revenue summary
    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE payment_status = $1',
      ['success']
    );

    // Get completed projects
    const completedResult = await pool.query(
      "SELECT COUNT(*) as count FROM orders WHERE status = 'completed'"
    );

    // Get active users (last 30 days)
    const activeUsersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at > NOW() - INTERVAL 30 days'
    );

    res.json({
      metrics: {
        totalCustomers: parseInt(customersResult.rows[0].count),
        totalOrders: parseInt(ordersResult.rows[0].count),
        pendingRequests: parseInt(pendingRequestsResult.rows[0].count),
        revenueSummary: parseFloat(revenueResult.rows[0].total),
        completedProjects: parseInt(completedResult.rows[0].count),
        activeUsers: parseInt(activeUsersResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, fullname, email, phone, role, status, email_verified, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all service requests
router.get('/service-requests', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT sr.*, u.fullname, u.email, u.phone FROM service_requests sr JOIN users u ON sr.user_id = u.id ORDER BY sr.created_at DESC'
    );

    res.json({ serviceRequests: result.rows });
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update service request status
router.put('/service-requests/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE service_requests SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE request_id = $3 RETURNING *',
      [status, admin_notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Create notification for user
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)',
      [result.rows[0].user_id, 'Service Request Updated', `Your service request status has been updated to: ${status}`, 'service', `/service-requests/${req.params.id}`]
    );

    res.json({ message: 'Service request status updated successfully', serviceRequest: result.rows[0] });
  } catch (error) {
    console.error('Update service request status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT o.*, u.fullname, u.email, u.phone FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all designs
router.get('/designs', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT d.*, u.fullname, u.email FROM designs d JOIN users u ON d.user_id = u.id ORDER BY d.created_at DESC'
    );

    res.json({ designs: result.rows });
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status
router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, fullname, email, status',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User status updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
