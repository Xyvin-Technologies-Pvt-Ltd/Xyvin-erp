// controllers/eventController.js
const Event = require('./event.model');

// @desc    Create a new event
// @route   POST /api/hrm/events
// @access  Private
const createEvent = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    const event = new Event({
      title,
      description,
      startDate,
      endDate,
      createdBy: req.user._id
    });

    const createdEvent = await event.save();
    
    res.status(201).json({
      success: true,
      event: createdEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events
// @route   GET /api/hrm/events
// @access  Private
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /hrm/events/:id
// @access  Private
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/hrm/events/:id
// @access  Private
const updateEvent = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        startDate,
        endDate
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      event: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/hrm/events/:id
// @access  Private
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent
};