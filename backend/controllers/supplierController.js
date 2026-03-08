import Supplier from '../models/Supplier.js';

export const getSuppliers = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { phone: { $regex: String(search), $options: 'i' } },
        { email: { $regex: String(search), $options: 'i' } },
      ];
    }

    const suppliers = await Supplier.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('❌ Get suppliers error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch suppliers' });
  }
};

export const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).lean();
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error('❌ Get supplier error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch supplier' });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, gstNumber, address } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const existing = await Supplier.findOne({ phone }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Supplier with this phone already exists' });
    }

    const supplier = await Supplier.create({
      name,
      phone,
      email,
      gstNumber,
      address,
      status: 'active',
    });

    res.status(201).json({ success: true, message: 'Supplier created successfully', data: supplier });
  } catch (error) {
    console.error('❌ Create supplier error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create supplier' });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body || {};

    const supplier = await Supplier.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, message: 'Supplier updated successfully', data: supplier });
  } catch (error) {
    console.error('❌ Update supplier error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update supplier' });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await Supplier.findByIdAndDelete(id);
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('❌ Delete supplier error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete supplier' });
  }
};
