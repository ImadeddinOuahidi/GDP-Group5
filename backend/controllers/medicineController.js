const { validationResult } = require('express-validator');
const Medicine = require('../models/Medicine');

// Get all medicines with filtering and pagination
exports.getAllMedicines = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      prescriptionRequired,
      search,
      manufacturer,
      inStock,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true, isDiscontinued: false };
    
    if (category) filter.category = category;
    if (prescriptionRequired !== undefined) filter.prescriptionRequired = prescriptionRequired === 'true';
    if (manufacturer) filter['manufacturer.name'] = new RegExp(manufacturer, 'i');
    if (inStock !== undefined) filter['availability.inStock'] = inStock === 'true';
    
    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { brandName: searchRegex },
        { therapeuticClass: searchRegex }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const medicines = await Medicine.find(filter)
      .populate('createdBy', 'firstName lastName role')
      .populate('updatedBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalMedicines = await Medicine.countDocuments(filter);
    const totalPages = Math.ceil(totalMedicines / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMedicines,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get medicine by ID
exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findById(id)
      .populate('createdBy', 'firstName lastName role')
      .populate('updatedBy', 'firstName lastName');

    if (!medicine || !medicine.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { medicine }
    });

  } catch (error) {
    console.error('Get medicine by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new medicine (Admin/Doctor only)
exports.createMedicine = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const medicineData = {
      ...req.body,
      createdBy: req.user._id
    };

    const medicine = new Medicine(medicineData);
    await medicine.save();

    // Populate creator info
    await medicine.populate('createdBy', 'firstName lastName role');

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: { medicine }
    });

  } catch (error) {
    console.error('Create medicine error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Medicine with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update medicine (Admin/Doctor only)
exports.updateMedicine = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy updatedBy', 'firstName lastName role');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: { medicine }
    });

  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete medicine (soft delete - Admin only)
exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        isDiscontinued: true,
        discontinuedDate: new Date(),
        discontinuedReason: req.body.reason || 'Deleted by admin',
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get medicines by category
exports.getMedicinesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const medicines = await Medicine.findByCategory(category)
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit));

    const totalMedicines = await Medicine.countDocuments({ 
      category, 
      isActive: true, 
      isDiscontinued: false 
    });

    res.status(200).json({
      success: true,
      data: {
        medicines,
        category,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMedicines / parseInt(limit)),
          totalMedicines
        }
      }
    });

  } catch (error) {
    console.error('Get medicines by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search medicines
exports.searchMedicines = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const medicines = await Medicine.searchByName(query)
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        medicines,
        searchQuery: query,
        resultsCount: medicines.length
      }
    });

  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get prescription medicines
exports.getPrescriptionMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const medicines = await Medicine.findPrescriptionMedicines()
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit));

    const totalMedicines = await Medicine.countDocuments({ 
      prescriptionRequired: true, 
      isActive: true, 
      isDiscontinued: false 
    });

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMedicines / parseInt(limit)),
          totalMedicines
        }
      }
    });

  } catch (error) {
    console.error('Get prescription medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get OTC medicines
exports.getOTCMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const medicines = await Medicine.findOTCMedicines()
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit));

    const totalMedicines = await Medicine.countDocuments({ 
      prescriptionRequired: false, 
      isActive: true, 
      isDiscontinued: false 
    });

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMedicines / parseInt(limit)),
          totalMedicines
        }
      }
    });

  } catch (error) {
    console.error('Get OTC medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update medicine stock
exports.updateMedicineStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, inStock } = req.body;

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { 
        'availability.quantity': quantity,
        'availability.inStock': inStock !== undefined ? inStock : quantity > 0,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        medicine: {
          _id: medicine._id,
          name: medicine.name,
          availability: medicine.availability,
          isLowStock: medicine.isLowStock
        }
      }
    });

  } catch (error) {
    console.error('Update medicine stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get low stock medicines
exports.getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.aggregate([
      {
        $match: {
          isActive: true,
          isDiscontinued: false,
          $expr: {
            $lte: ['$availability.quantity', '$availability.minimumStock']
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy'
        }
      },
      {
        $unwind: '$createdBy'
      },
      {
        $project: {
          name: 1,
          genericName: 1,
          category: 1,
          availability: 1,
          'createdBy.firstName': 1,
          'createdBy.lastName': 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        medicines,
        count: medicines.length
      }
    });

  } catch (error) {
    console.error('Get low stock medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};