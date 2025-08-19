const Message = require('./Message.model');
const Employee = require('../hrm/employee/employee.model');
const Notification = require('../notification/Notification.model');
const websocketService = require('../../utils/websocket');

// List users by optional role filter
exports.listUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      if (role === 'Admin') {
        filter.role = { $in: ['ERP System Administrator', 'Admin'] };
      } else {
        filter.role = role;
      }
    }
    // Always exclude the current user from the list
    filter._id = { $ne: req.user._id };
    const users = await Employee.find(filter)
      .select('firstName lastName email role department position profilePicture')
      .populate('position', 'title')
      .populate('department', 'name');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// List conversation counterparts with last message and unread count
exports.listConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const pipeline = [
      {
        $match: {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        }
      },
      {
        $addFields: {
          counterpart: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$recipient',
              '$sender'
            ]
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$counterpart',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [ { $eq: ['$recipient', userId] }, { $eq: ['$read', false] } ] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          user: {
            _id: '$user._id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            email: '$user.email',
            role: '$user.role',
            profilePicture: '$user.profilePicture'
          },
          lastMessage: 1,
          unreadCount: 1
        }
      }
    ];

    const conversations = await Message.aggregate(pipeline);
    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
};

// Get message history with a specific user
exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// Send a new message
exports.sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const recipientId = req.params.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const message = await Message.create({ sender: senderId, recipient: recipientId, content: content.trim() });

    // Create a notification
    const notification = await Notification.create({
      user: recipientId,
      sender: senderId,
      title: 'New Message',
      message: content.length > 100 ? content.slice(0, 100) + '…' : content,
      type: 'CHAT_MESSAGE'
    });

    // Real-time push to recipient
    websocketService.sendToUser(recipientId.toString(), {
      type: 'chat',
      data: {
        _id: message._id,
        sender: senderId,
        recipient: recipientId,
        content: message.content,
        createdAt: message.createdAt,
        read: false
      }
    });

    // Also push a notification event
    websocketService.sendToUser(recipientId.toString(), {
      type: 'notification',
      data: {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt,
        sender: senderId
      }
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// Mark messages from a specific user as read
exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;
    await Message.updateMany({ sender: otherUserId, recipient: userId, read: false }, { $set: { read: true } });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Delete a message
exports.deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const messageId = req.params.messageId;
    
    // Find the message and check if user is the sender
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    // Only allow sender to delete their own message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }
    
    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};


