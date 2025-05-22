  const Profit = require('../profit/profit.model');
const { createError } = require('../../../utils/errors');
const { uploadFile } = require('../../../utils/fileUpload');

// Get next profit number
const getNextProfitNumber = async (req, res) => {
  try {
    // Find the last profit record, sorted by profitNumber in descending order
    const lastProfit = await Profit.findOne({}, { profitNumber: 1 })
      .sort({ profitNumber: -1 });

    // If no profits exist, start with PRF-0001, else increment the last number
    const nextNumber = lastProfit 
      ? String(Number(lastProfit.profitNumber.split('-')[1]) + 1).padStart(4, '0')
      : '0001';

    const profitNumber = `PRF-${nextNumber}`;

    res.json({
      success: true,
      data: {
        profit: { profitNumber }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new profit
const createProfit = async (req, res) => {
  try {
    const files = req.files;
    const documents = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const fileUrl = await uploadFile(file);
        documents.push({
          fileName: file.originalname,
          fileUrl: fileUrl
        });
      }
    }

    // Get the next profit number
    const lastProfit = await Profit.findOne({}, { profitNumber: 1 })
      .sort({ profitNumber: -1 });
    const nextNumber = lastProfit 
      ? String(Number(lastProfit.profitNumber.split('-')[1]) + 1).padStart(4, '0')
      : '0001';
    const profitNumber = `PRF-${nextNumber}`;

    const profit = new Profit({
      ...req.body,
      profitNumber,
      documents
    });

    await profit.save();
    res.status(201).json(profit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all profits
const getProfits = async (req, res) => {
  try {
    const { status, category, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const profits = await Profit.find(filter).sort({ date: -1 });
    res.json(profits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get profit by ID
const getProfitById = async (req, res) => {
  try {
    const profit = await Profit.findById(req.params.id);
    if (!profit) {
      return res.status(404).json({ message: 'Profit not found' });
    }
    res.json(profit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update profit
const updateProfit = async (req, res) => {
  try {
    const profit = await Profit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!profit) {
      return res.status(404).json({ message: 'Profit not found' });
    }
    res.json(profit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete profit
const deleteProfit = async (req, res) => {
  try {
    const profit = await Profit.findByIdAndDelete(req.params.id);
    if (!profit) {
      return res.status(404).json({ message: 'Profit not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get profit statistics
const getProfitStats = async (req, res) => {
  try {
    const stats = await Profit.aggregate([
      {
        $match: {
          status: 'Verified'
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const overall = {
      totalAmount: 0,
      totalCount: 0,
      categoryBreakdown: stats
    };

    stats.forEach(stat => {
      overall.totalAmount += stat.totalAmount;
      overall.totalCount += stat.count;
    });

    res.json(overall);
  } catch (error) {
    throw createError(error.statusCode || 500, error.message);
  }
};

module.exports = {
  createProfit,
  getProfits,
  getProfitById,
  updateProfit,
  deleteProfit,
  getProfitStats,
  getNextProfitNumber
};