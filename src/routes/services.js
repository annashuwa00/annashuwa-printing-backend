const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create service request
router.post('/request', auth, [
  body('service').trim().notEmpty().withMessage('Service type is required'),
  body('details').trim().notEmpty().withMessage('Details are required'),
  body('quantity').optional().isInt().withMessage('Quantity must be a number'),
  body('budget').optional().isDecimal().withMessage('Budget must be a number'),
  body('deadline').optional().isISO8601().withMessage('Invalid deadline date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { service, details, quantity, deadline, budget, priority, reference_files } = req.body;

    // Generate tracking number
    const trackingNumber = `SRV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const result = await pool.query(
      'INSERT INTO service_requests (user_id, service, details, quantity, deadline, budget, priority, reference_files, tracking_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.id, service, details, quantity, deadline, budget, priority || 'normal', reference_files || [], trackingNumber]
    );

    // Create notification for admin
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, link) SELECT id, $1, $2, $3, $4 FROM users WHERE role IN ($5, $6)',
      ['New Service Request', `New service request from ${req.user.email}: ${service}`, 'service', `/admin/service-requests/${result.rows[0].request_id}`, 'admin', 'super_admin']
    );

    res.status(201).json({ 
      message: 'Service request submitted successfully', 
      serviceRequest: result.rows[0] 
    });
  } catch (error) {
    console.error('Create service request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's service requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM service_requests WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ serviceRequests: result.rows });
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get service request by ID
router.get('/request/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM service_requests WHERE request_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json({ serviceRequest: result.rows[0] });
  } catch (error) {
    console.error('Get service request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available services
router.get('/available', async (req, res) => {
  try {
    const services = [
      'Graphic Design',
      'Printing',
      'Branding',
      'Frame Production',
      'Banner Production',
      'Shirt Printing',
      'Mug Printing',
      'Logo Design',
      'Document Printing',
      'Business Center Services'
    ];

    res.json({ services });
  } catch (error) {
    console.error('Get available services error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
