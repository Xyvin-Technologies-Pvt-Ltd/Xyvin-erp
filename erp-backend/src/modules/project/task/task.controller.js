const Task = require('./task.model');
const Employee = require('../../hrm/employee/employee.model');
const Project = require('../project.model');
const createError = require('http-errors');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, project, assignee, status, priority, dueDate } = req.body;

    // Validate project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      throw createError(404, 'Project not found');
    }

    // Create the task
    const task = new Task({
      title,
      description,
      project,
      assignee,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      createdBy: req.user._id
    });

    await task.save();

    // Add task to project's tasks array
    await Project.findByIdAndUpdate(
      project,
      { $push: { tasks: task._id } }
    );

    // If assignee is specified, add task to employee's tasks array
    if (assignee) {
      await Employee.findByIdAndUpdate(assignee, {
        $addToSet: { tasks: task._id }
      });
    }

    // Populate task data
    await task.populate([
      { path: 'assignee', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(error.status || 500).json({ 
      message: error.message || 'Error creating task',
      error: error
    });
  }
};

// Get all tasks for a project
exports.getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log('Fetching tasks for project:', projectId);

    const tasks = await Task.find({ project: projectId })
      .populate({
        path: 'assignee',
        select: 'firstName lastName email role',
        model: 'Employee'
      })
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email role',
        model: 'Employee'
      })
      .populate({
        path: 'project',
        select: 'name description',
        model: 'Project'
      })
      .populate({
        path: 'comments.author',
        select: 'firstName lastName email role',
        model: 'Employee'
      })
      .lean();

    console.log('Raw tasks before transform:', JSON.stringify(tasks, null, 2));

    // Transform tasks and ensure proper population
    const transformedTasks = tasks.map(task => {
      // Ensure assignee and createdBy are properly formatted when they exist
      const assignee = task.assignee ? {
        _id: task.assignee._id,
        firstName: task.assignee.firstName,
        lastName: task.assignee.lastName,
        email: task.assignee.email,
        role: task.assignee.role
      } : null;

      const createdBy = task.createdBy ? {
        _id: task.createdBy._id,
        firstName: task.createdBy.firstName,
        lastName: task.createdBy.lastName,
        email: task.createdBy.email,
        role: task.createdBy.role
      } : null;

      return {
        ...task,
        assignee,
        createdBy,
        project: task.project || null
      };
    });

    console.log('Transformed tasks:', JSON.stringify(transformedTasks, null, 2));
    res.json(transformedTasks);
  } catch (error) {
    console.error('Error getting project tasks:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    console.log('Updating task status:', { taskId, status });

    const task = await Task.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }

    task.status = status;
    await task.save();

    await task.populate([
      { path: 'assignee', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(error.status || 500).json({ 
      message: error.message || 'Error updating task status',
      error: error
    });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, attachments } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }

    task.comments.push({
      content,
      author: req.user._id,
      attachments: attachments || []
    });

    await task.save();

    await task.populate([
      { path: 'comments.author', select: 'firstName lastName' },
      { path: 'assignee', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.json(task);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Add attachment to task
exports.addAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, url } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }

    task.attachments.push({
      name,
      url,
      uploadedBy: req.user._id
    });

    await task.save();

    await task.populate([
      { path: 'attachments.uploadedBy', select: 'firstName lastName' },
      { path: 'assignee', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    res.json(task);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    console.log('Update task request:', { taskId, updates });

    // Get the old task to check for assignee changes
    const oldTask = await Task.findById(taskId);
    if (!oldTask) {
      throw createError(404, 'Task not found');
    }

    // If assignee is being changed, update the employee's tasks array
    if (updates.assignee !== undefined && updates.assignee !== oldTask.assignee?.toString()) {
      console.log('Assignee change detected:', {
        old: oldTask.assignee,
        new: updates.assignee
      });

      // Remove task from old assignee's tasks array if exists
      if (oldTask.assignee) {
        await Employee.findByIdAndUpdate(oldTask.assignee, {
          $pull: { tasks: taskId }
        });
      }

      // Add task to new assignee's tasks array if new assignee is specified
      if (updates.assignee) {
        await Employee.findByIdAndUpdate(updates.assignee, {
          $addToSet: { tasks: taskId }
        });
      }
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true }
    )
    .populate({
      path: 'assignee',
      select: 'firstName lastName email role',
      model: 'Employee'
    })
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email role',
      model: 'Employee'
    })
    .populate({
      path: 'project',
      select: 'name description',
      model: 'Project'
    })
    .lean();

    if (!updatedTask) {
      throw createError(404, 'Task not found after update');
    }

    // Transform the updated task
    const transformedTask = {
      ...updatedTask,
      assignee: updatedTask.assignee ? {
        _id: updatedTask.assignee._id,
        firstName: updatedTask.assignee.firstName,
        lastName: updatedTask.assignee.lastName,
        email: updatedTask.assignee.email,
        role: updatedTask.assignee.role
      } : null,
      createdBy: updatedTask.createdBy ? {
        _id: updatedTask.createdBy._id,
        firstName: updatedTask.createdBy.firstName,
        lastName: updatedTask.createdBy.lastName,
        email: updatedTask.createdBy.email,
        role: updatedTask.createdBy.role
      } : null,
      project: updatedTask.project || null
    };

    console.log('Updated task:', JSON.stringify(transformedTask, null, 2));
    res.json(transformedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(error.status || 500).json({ 
      message: error.message || 'Error updating task',
      error: error
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      throw createError(404, 'Task not found');
    }

    // Remove task from assignee's tasks array if exists
    if (task.assignee) {
      await Employee.findByIdAndUpdate(task.assignee, {
        $pull: { tasks: taskId }
      });
    }

    await task.deleteOne();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}; 