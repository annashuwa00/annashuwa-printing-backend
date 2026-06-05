const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create order
router.post('/', auth, [
  body('service_type').trim().notEmpty().withMessage('Service type is required'),
  body('quantity').optional().isInt().withMessage('Quantity must be a number'),
  body('amount').optional().isDecimal().withMessage('Amount must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { service_type, description, quantity, amount, delivery_address } = req.body;

    // Generate tracking number
    const trackingNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const result = await pool.query(
      'INSERT INTO orders (user_id, service_type, description, quantity, amount, tracking_number, delivery_address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, service_type, description, quantity || 1, amount, trackingNumber, delivery_address]
    );

    // Create notification for user
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'Order Created', `Your order ${trackingNumber} has been created successfully`, 'order', `/orders/${result.rows[0].order_id}`]
    );

    res.status(201).json({ message: 'Order created successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create notification for user
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5)',
      [result.rows[0].user_id, 'Order Status Updated', `Your order status has been updated to: ${status}`, 'order', `/orders/${req.params.id}`]
    );

    res.json({ message: 'Order status updated successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
