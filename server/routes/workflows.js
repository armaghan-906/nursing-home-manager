const express = require('express');
const router = express.Router();
const WorkflowTemplate = require('../models/WorkflowTemplate');
const { protect, admin } = require('../middleware/auth');

// @route   GET /api/workflows
// @desc    Get all workflow templates
router.get('/', protect, async (req, res) => {
  try {
    const { fundingType, category } = req.query;
    let query = { isActive: true };

    if (fundingType) query.fundingType = fundingType;
    if (category) query.category = category;

    const templates = await WorkflowTemplate.find(query).sort({ category: 1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/workflows
// @desc    Create a workflow template
router.post('/', protect, async (req, res) => {
  try {
    const template = await WorkflowTemplate.create(req.body);
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/workflows/:id
// @desc    Update a workflow template
router.put('/:id', protect, async (req, res) => {
  try {
    const template = await WorkflowTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/workflows/:id
// @desc    Delete a workflow template
router.delete('/:id', protect, async (req, res) => {
  try {
    await WorkflowTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
