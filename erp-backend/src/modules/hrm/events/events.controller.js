// controllers/eventController.js
const Event = require("./event.model");
const Notification = require("../../notification/Notification.model");
const websocketService = require("../../../utils/websocket");
const Employee = require("../../hrm/employee/employee.model");

// @desc    Create a new event
// @route   POST /api/hrm/events
// @access  Private
const createEvent = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate } = req.body;
    await Employee.updateMany({}, { $set: { needToViewEvent: true } });
    const event = new Event({
      title,
      description,
      startDate,
      endDate,
      createdBy: req.user._id,
    });

    const createdEvent = await event.save();

    //notification
    const allEmployees = await Employee.find({}, "_id");

    for (const emp of allEmployees) {
      const notification = await Notification.create({
        user: emp._id,
        sender: req.user._id,
        title: `New Event: ${title}`,
        message: `An event "${title}" has been scheduled.`,
        type: "EVENT_CREATED",
      });

      // Send real-time notification
      websocketService.sendToUser(emp._id.toString(), {
        type: "notification",
        data: {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          sender: {
            _id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
          },
          eventId: event._id,
        },
      });
    }

    res.status(201).json({
      success: true,
      event: createdEvent,
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
    const events = await Event.find()
      .populate("createdBy", "name email")
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      events,
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
    const event = await Event.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event,
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
        message: "Event not found",
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        startDate,
        endDate,
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");

    const allEmployees = await Employee.find({}, "_id");

    for (const emp of allEmployees) {
      const notification = await Notification.create({
        user: emp._id,
        sender: req.user._id,
        title: `Event Updated: ${updatedEvent.title}`,
        message: `The event "${updatedEvent.title}" has been updated.`,
        type: "EVENT_UPDATED",
      });

      // Real-time WebSocket push
      websocketService.sendToUser(emp._id.toString(), {
        type: "notification",
        data: {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          sender: {
            _id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
          },
          eventId: updatedEvent._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      event: updatedEvent,
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
        message: "Event not found",
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
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
  deleteEvent,
};
