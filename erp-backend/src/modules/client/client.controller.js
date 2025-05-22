const Client = require('./client.model');
const { validateClient } = require('./client.validation');

// Create new client
exports.createClient = async (req, res) => {
  try {
    const { error } = validateClient(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const client = new Client({
      ...req.body,
      createdBy: req.user._id
    });

    await client.save();
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find()
    
      .sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single client
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const { error } = validateClient(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 