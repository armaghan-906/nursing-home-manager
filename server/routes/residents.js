const express = require('express');
const router = express.Router();
const Resident = require('../models/Resident');
const Task = require('../models/Task');
const WorkflowTemplate = require('../models/WorkflowTemplate');
const { protect } = require('../middleware/auth');

// @route   GET /api/residents
// @desc    Get all residents
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, fundingType, page = 1, limit = 50 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (fundingType && fundingType !== 'all') {
      query.fundingType = fundingType;
    }

    // Don't show discharged/deceased by default unless explicitly asked
    if (!status) {
      query.status = { $nin: ['discharged', 'deceased'] };
    }

    // Filter by archived status (default to active only)
    const showArchived = req.query.archived === 'true';
    query.archived = showArchived;

    const residents = await Resident.find(query)
      .sort({ lastName: 1, firstName: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get workflow progress for each resident
    const residentsWithProgress = await Promise.all(
      residents.map(async (resident) => {
        const tasks = await Task.find({ residentId: resident._id });
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...resident.toObject(),
          workflowProgress: progress,
          totalTasks,
          completedTasks
        };
      })
    );

    const total = await Resident.countDocuments(query);

    res.json({
      residents: residentsWithProgress,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/residents/stats
// @desc    Get resident statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const totalActive = await Resident.countDocuments({ status: { $nin: ['discharged', 'deceased'] } });
    const admissions = await Resident.countDocuments({ status: 'admission' });
    const ongoingCare = await Resident.countDocuments({ status: 'ongoing-care' });
    const dischargePlanning = await Resident.countDocuments({ status: 'discharge-planning' });

    const fundingBreakdown = await Resident.aggregate([
      { $match: { status: { $nin: ['discharged', 'deceased'] } } },
      { $group: { _id: '$fundingType', count: { $sum: 1 } } }
    ]);

    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const overdueTasks = await Task.countDocuments({
      status: { $in: ['pending', 'in-progress'] },
      dueDate: { $lt: new Date() }
    });

    res.json({
      totalActive,
      admissions,
      ongoingCare,
      dischargePlanning,
      fundingBreakdown,
      pendingTasks,
      inProgressTasks,
      overdueTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/residents/:id
// @desc    Get single resident
router.get('/:id', protect, async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Get tasks grouped by category
    const tasks = await Task.find({ residentId: resident._id }).sort({ category: 1, order: 1 });

    const tasksByCategory = {
      'records-update': tasks.filter(t => t.category === 'records-update'),
      'invoicing-agreement': tasks.filter(t => t.category === 'invoicing-agreement'),
      'contract': tasks.filter(t => t.category === 'contract'),
      'long-term-funding': tasks.filter(t => t.category === 'long-term-funding'),
      'fnc': tasks.filter(t => t.category === 'fnc'),
      'post-demise-discharge': tasks.filter(t => t.category === 'post-demise-discharge'),
      'hl-tasks': tasks.filter(t => t.category === 'hl-tasks'),
      'change-in-funding': tasks.filter(t => t.category === 'change-in-funding')
    };

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      ...resident.toObject(),
      tasks: tasksByCategory,
      workflowProgress: progress,
      totalTasks,
      completedTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/residents
// @desc    Create a resident and generate workflow tasks
router.post('/', protect, async (req, res) => {
  try {
    const resident = await Resident.create({
      ...req.body,
      createdBy: req.user._id
    });

    // Generate tasks from workflow templates
    const fundingType = resident.fundingType;

    // Get templates for this funding type + universal templates
    const templates = await WorkflowTemplate.find({
      $or: [
        { fundingType },
        { fundingType: 'all' }
      ],
      isActive: true
    }).sort({ category: 1 });

    const tasksToCreate = [];

    for (const template of templates) {
      for (const taskTemplate of template.tasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (taskTemplate.estimatedDays || 7));

        tasksToCreate.push({
          residentId: resident._id,
          title: taskTemplate.title,
          description: taskTemplate.description,
          category: template.category,
          fundingType: template.fundingType,
          status: 'pending',
          priority: taskTemplate.priority,
          assignedTo: taskTemplate.defaultAssignee || '',
          dueDate,
          order: taskTemplate.order,
          createdBy: req.user._id
        });
      }
    }

    if (tasksToCreate.length > 0) {
      await Task.insertMany(tasksToCreate);
    }

    res.status(201).json(resident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/residents/:id
// @desc    Update a resident
router.put('/:id', protect, async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    const oldFundingType = resident.fundingType;
    const newFundingType = req.body.fundingType;

    const updatedResident = await Resident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // If funding type changed, regenerate tasks
    if (newFundingType && oldFundingType !== newFundingType) {
      // Remove tasks that were specific to old funding type and are still pending
      await Task.deleteMany({
        residentId: resident._id,
        fundingType: oldFundingType,
        status: 'pending'
      });

      // Get new funding-specific templates
      const newTemplates = await WorkflowTemplate.find({
        fundingType: newFundingType,
        isActive: true
      });

      const existingTasks = await Task.find({ residentId: resident._id });
      const existingTitles = existingTasks.map(t => t.title);

      const tasksToCreate = [];
      for (const template of newTemplates) {
        for (const taskTemplate of template.tasks) {
          // Only add tasks that don't already exist
          if (!existingTitles.includes(taskTemplate.title)) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (taskTemplate.estimatedDays || 7));

            tasksToCreate.push({
              residentId: resident._id,
              title: taskTemplate.title,
              description: taskTemplate.description,
              category: template.category,
              fundingType: newFundingType,
              status: 'pending',
              priority: taskTemplate.priority,
              assignedTo: taskTemplate.defaultAssignee || '',
              dueDate,
              order: taskTemplate.order,
              createdBy: req.user._id
            });
          }
        }
      }

      if (tasksToCreate.length > 0) {
        await Task.insertMany(tasksToCreate);
      }
    }

    res.json(updatedResident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/residents/:id/change-funding
// @desc    Generate change-in-funding tasks for a new funding type
router.post('/:id/change-funding', protect, async (req, res) => {
  try {
    const { newFundingType } = req.body;
    if (!newFundingType) {
      return res.status(400).json({ message: 'newFundingType is required' });
    }

    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    const templates = await WorkflowTemplate.find({
      category: 'change-in-funding',
      fundingType: newFundingType,
      isActive: true
    });

    if (!templates.length) {
      return res.status(404).json({ message: 'No tasks configured for this funding type yet' });
    }

    // Get existing tasks to avoid duplicates
    const existingTasks = await Task.find({ residentId: resident._id });
    const existingTitles = existingTasks.map(t => t.title);

    const tasksToCreate = [];
    for (const template of templates) {
      for (const taskTemplate of template.tasks) {
        // Only add tasks that don't already exist
        if (!existingTitles.includes(taskTemplate.title)) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + (taskTemplate.estimatedDays || 7));
          tasksToCreate.push({
            residentId: resident._id,
            title: taskTemplate.title,
            description: taskTemplate.description || '',
            category: 'change-in-funding',
            fundingType: newFundingType,
            status: 'pending',
            priority: taskTemplate.priority,
            assignedTo: taskTemplate.defaultAssignee || '',
            dueDate,
            order: taskTemplate.order,
            createdBy: req.user._id
          });
        }
      }
    }

    await Task.insertMany(tasksToCreate);
    res.json({ message: `${tasksToCreate.length} tasks generated for ${newFundingType} funding change` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/residents/:id/archive
// @desc    Archive a resident (soft delete)
router.post('/:id/archive', protect, async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    );

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    res.json({ message: 'Resident archived successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/residents/:id/unarchive
// @desc    Unarchive a resident (reactivate)
router.post('/:id/unarchive', protect, async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      { archived: false },
      { new: true }
    );

    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    res.json({ message: 'Resident unarchived successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/residents/:id
// @desc    Delete a resident
router.delete('/:id', protect, async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Delete all associated tasks
    await Task.deleteMany({ residentId: resident._id });
    await Resident.findByIdAndDelete(req.params.id);

    res.json({ message: 'Resident removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
