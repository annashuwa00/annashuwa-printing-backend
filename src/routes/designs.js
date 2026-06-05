const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new design
router.post('/', auth, [
  body('design_name').trim().notEmpty().withMessage('Design name is required'),
  body('design_data').notEmpty().withMessage('Design data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { design_name, design_data, file_path, thumbnail_path, template_type, is_public } = req.body;

    const result = await pool.query(
      'INSERT INTO designs (user_id, design_name, design_data, file_path, thumbnail_path, template_type, is_public) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.id, design_name, JSON.stringify(design_data), file_path, thumbnail_path, template_type, is_public || false]
    );

    res.status(201).json({ message: 'Design saved successfully', design: result.rows[0] });
  } catch (error) {
    console.error('Create design error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all designs (public)
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT design_id, design_name, thumbnail_path, template_type, created_at FROM designs WHERE is_public = true ORDER BY created_at DESC LIMIT 50'
    );

    res.json({ designs: result.rows });
  } catch (error) {
    console.error('Get public designs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get design by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM designs WHERE design_id = $1 AND (user_id = $2 OR is_public = true)',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json({ design: result.rows[0] });
  } catch (error) {
    console.error('Get design error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update design
router.put('/:id', auth, [
  body('design_name').optional().trim().notEmpty().withMessage('Design name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { design_name, design_data, file_path, thumbnail_path, is_public } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (design_name) {
      updates.push(`design_name = $${paramCount++}`);
      values.push(design_name);
    }

    if (design_data) {
      updates.push(`design_data = $${paramCount++}`);
      values.push(JSON.stringify(design_data));
    }

    if (file_path !== undefined) {
      updates.push(`file_path = $${paramCount++}`);
      values.push(file_path);
    }

    if (thumbnail_path !== undefined) {
      updates.push(`thumbnail_path = $${paramCount++}`);
      values.push(thumbnail_path);
    }

    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(is_public);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);
    values.push(req.user.id);

    const query = `UPDATE designs SET ${updates.join(', ')} WHERE design_id = $${paramCount++} AND user_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json({ message: 'Design updated successfully', design: result.rows[0] });
  } catch (error) {
    console.error('Update design error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete design
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM designs WHERE design_id = $1 AND user_id = $2 RETURNING design_id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Delete design error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
