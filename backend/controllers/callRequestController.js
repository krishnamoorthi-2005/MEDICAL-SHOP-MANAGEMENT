import CallRequest from '../models/CallRequest.js';

export const listCallRequests = async (req, res) => {
  try {
    const requests = await CallRequest.find().sort({ createdAt: -1 }).lean();
    // Transform _id to id for frontend compatibility
    const formattedRequests = requests.map(req => ({
      ...req,
      id: req._id.toString(),
    }));
    res.json({ success: true, data: formattedRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch call requests', error: error.message });
  }
};

export const createCallRequest = async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required' });
    }

    const callRequest = await CallRequest.create({
      name: name.trim(),
      phone: phone.trim(),
      message: message?.trim() || '',
      status: 'pending',
    });

    const formatted = {
      ...callRequest.toObject(),
      id: callRequest._id.toString(),
    };

    res.status(201).json({
      success: true,
      message: 'Call request submitted successfully',
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create call request', error: error.message });
  }
};

export const updateCallRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const callRequest = await CallRequest.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true },
    ).lean();

    if (!callRequest) {
      return res.status(404).json({ success: false, message: 'Call request not found' });
    }

    const formatted = {
      ...callRequest,
      id: callRequest._id.toString(),
    };

    res.json({
      success: true,
      message: 'Call request status updated',
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update call request', error: error.message });
  }
};
