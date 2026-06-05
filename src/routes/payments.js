const express = require('express');
const { body, validationResult } = require('express-validator');
const Paystack = require('paystack');
const Flutterwave = require('flutterwave-node-v3');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize payment gateways only if valid keys are present (not placeholders)
const paystack = (process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY !== 'your_paystack_secret_key') 
  ? new Paystack(process.env.PAYSTACK_SECRET_KEY) 
  : null;
const flutterwave = (process.env.FLUTTERWAVE_SECRET_KEY && process.env.FLUTTERWAVE_SECRET_KEY !== 'your_flutterwave_secret_key') 
  ? new Flutterwave(process.env.FLUTTERWAVE_SECRET_KEY) 
  : null;

// Initialize Paystack transaction
router.post('/paystack/initialize', auth, [
  body('amount').isDecimal().withMessage('Amount must be a number'),
  body('order_id').optional().isInt().withMessage('Order ID must be a number')
], async (req, res) => {
  try {
    if (!paystack) {
      return res.status(503).json({ error: 'Paystack payment gateway not configured' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, order_id, email } = req.body;

    const params = {
      amount: amount * 100, // Paystack expects amount in kobo
      email: email || req.user.email,
      metadata: {
        user_id: req.user.id,
        order_id: order_id
      }
    };

    const response = await paystack.transaction.initialize(params);

    res.json({ authorization_url: response.data.authorization_url, reference: response.data.reference });
  } catch (error) {
    console.error('Paystack initialize error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Verify Paystack transaction
router.post('/paystack/verify', auth, async (req, res) => {
  try {
    if (!paystack) {
      return res.status(503).json({ error: 'Paystack payment gateway not configured' });
    }

    const { reference } = req.body;

    const response = await paystack.transaction.verify(reference);

    if (response.data.status === 'success') {
      // Create transaction record
      await pool.query(
        'INSERT INTO transactions (user_id, order_id, amount, payment_method, payment_status, transaction_reference, gateway_response) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [req.user.id, response.data.metadata.order_id, response.data.amount / 100, 'paystack', 'success', reference, JSON.stringify(response.data)]
      );

      // Update order status if order_id exists
      if (response.data.metadata.order_id) {
        await pool.query(
          "UPDATE orders SET status = 'processing' WHERE order_id = $1",
          [response.data.metadata.order_id]
        );
      }

      res.json({ message: 'Payment verified successfully', transaction: response.data });
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    console.error('Paystack verify error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Initialize Flutterwave transaction
router.post('/flutterwave/initialize', auth, [
  body('amount').isDecimal().withMessage('Amount must be a number'),
  body('order_id').optional().isInt().withMessage('Order ID must be a number')
], async (req, res) => {
  try {
    if (!flutterwave) {
      return res.status(503).json({ error: 'Flutterwave payment gateway not configured' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, order_id, email } = req.body;

    const params = {
      tx_ref: `TX-${Date.now()}`,
      amount: amount,
      currency: 'NGN',
      email: email || req.user.email,
      payment_options: 'card, banktransfer',
      meta: {
        user_id: req.user.id,
        order_id: order_id
      },
      customer: {
        email: email || req.user.email,
        name: req.user.fullname
      },
      customizations: {
        title: 'Annashuwa Printing Solution',
        description: 'Payment for printing services'
      }
    };

    const response = await flutterwave.PaymentLink.create(params);

    res.json({ payment_link: response.data.link, reference: response.data.tx_ref });
  } catch (error) {
    console.error('Flutterwave initialize error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Verify Flutterwave transaction
router.post('/flutterwave/verify', auth, async (req, res) => {
  try {
    if (!flutterwave) {
      return res.status(503).json({ error: 'Flutterwave payment gateway not configured' });
    }

    const { transaction_id } = req.body;

    const response = await flutterwave.Transaction.verify({ id: transaction_id });

    if (response.data.status === 'successful') {
      // Create transaction record
      await pool.query(
        'INSERT INTO transactions (user_id, order_id, amount, payment_method, payment_status, transaction_reference, gateway_response) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [req.user.id, response.data.meta.order_id, response.data.amount, 'flutterwave', 'success', response.data.tx_ref, JSON.stringify(response.data)]
      );

      // Update order status if order_id exists
      if (response.data.meta.order_id) {
        await pool.query(
          "UPDATE orders SET status = 'processing' WHERE order_id = $1",
          [response.data.meta.order_id]
        );
      }

      res.json({ message: 'Payment verified successfully', transaction: response.data });
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    console.error('Flutterwave verify error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get user's transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
