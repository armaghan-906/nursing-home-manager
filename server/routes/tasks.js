const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const { cloudinary, storage } = require('../config/cloudinary');

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv/;
    const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only document and image files are allowed'));
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks (with filters)
router.get('/', protect, async (req, res) => {
  try {
    const { residentId, category, status, assignedTo, priority, dueDate } = req.query;
    let query = {};

    if (residentId) query.residentId = residentId;
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;
    if (assignedTo) query.assignedTo = { $regex: assignedTo, $options: 'i' };
    if (priority && priority !== 'all') query.priority = priority;

    if (dueDate === 'overdue') {
      query.dueDate = { $lt: new Date() };
      query.status = { $in: ['pending', 'in-progress'] };
    } else if (dueDate === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.dueDate = { $gte: today, $lt: tomorrow };
    } else if (dueDate === 'this-week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      query.dueDate = { $gte: today, $lt: endOfWeek };
    }

    const tasks = await Task.find(query)
      .populate('residentId', 'firstName lastName roomNumber admissionDate fundingType fundingRate')
      .sort({ order: 1, createdAt: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('residentId', 'firstName lastName roomNumber fundingType');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/tasks
// @desc    Create a task
router.post('/', protect, async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If status changed to completed, set completedDate
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedDate = new Date();
    }

    // If status changed away from completed, clear completedDate
    if (req.body.status && req.body.status !== 'completed') {
      req.body.completedDate = null;
    }

    req.body.updatedBy = req.user._id;

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete associated files from Cloudinary
    for (const attachment of task.attachments) {
      if (attachment.cloudinaryId) {
        await cloudinary.uploader.destroy(attachment.cloudinaryId, { resource_type: 'raw' });
      }
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/tasks/:id/attachments
// @desc    Upload attachment to a task
router.post('/:id/attachments', protect, upload.single('file'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      cloudinaryId: req.file.filename,
      uploadedBy: req.user._id
    };

    task.attachments.push(attachment);
    await task.save();

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/tasks/:taskId/attachments/:attachmentId
// @desc    Delete an attachment from a task
router.delete('/:taskId/attachments/:attachmentId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Delete file from Cloudinary
    if (attachment.cloudinaryId) {
      await cloudinary.uploader.destroy(attachment.cloudinaryId, { resource_type: 'raw' });
    }

    task.attachments.pull(req.params.attachmentId);
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
