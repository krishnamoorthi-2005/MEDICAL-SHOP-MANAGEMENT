import Customer from '../models/Customer.js';

/**
 * Controller to delete all customers (for admin use only)
 * Add this to your customer routes for testing/development
 */
export const deleteAllCustomers = async (req, res) => {
  try {
    // Check if user is admin (you can add more security here)
    if (req.user?.role?.toLowerCase() !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only administrators can delete all customers' 
      });
    }

    const count = await Customer.countDocuments({});
    
    if (count === 0) {
      return res.json({ 
        success: true, 
        message: 'No customers to delete',
        deletedCount: 0 
      });
    }

    const result = await Customer.deleteMany({});

    res.json({ 
      success: true, 
      message: `Successfully deleted ${result.deletedCount} customer(s)`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('Error deleting all customers:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};
