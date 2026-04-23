const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Offer = require("../models/Offer");
const ComboMeal = require("../models/ComboMeal");
const Order = require("../models/Order");
const Poll = require("../models/Poll");
const PollProposal = require("../models/PollProposal");
const User = require("../models/User");
const { createOrderNotification, broadcastNotificationToStudents } = require("../services/notificationService");

const getStudentStatusNotificationContent = (status, orderNumber) => {
  const statusContent = {
    confirmed: {
      title: "Order is being prepared",
      message: `Order ${orderNumber} is now preparing.`
    },
    ready: {
      title: "Food is ready",
      message: `Order ${orderNumber} is ready now. You can pick it up.`
    },
    cancelled: {
      title: "Order cancelled",
      message: `Order ${orderNumber} has been cancelled by the shop owner.`
    },
    completed: {
      title: "Order completed",
      message: `Order ${orderNumber} was marked as completed.`
    }
  };

  return statusContent[status] || null;
};

/**
 * Auto-create restaurant if it doesn't exist
 * This prevents "Restaurant profile not found" error
 */
const ensureRestaurantExists = async (shopOwnerId) => {
  try {
    let restaurant = await Restaurant.findOne({ shopOwnerId });
    
    if (!restaurant) {
      // Get shop owner data from User model
      const shopOwner = await User.findById(shopOwnerId);
      if (!shopOwner || shopOwner.role !== 'shop-owner') {
        throw new Error('Shop owner not found');
      }

      // Auto-create restaurant using User data
      restaurant = new Restaurant({
        shopOwnerId: shopOwnerId,
        shopName: shopOwner.shopName,
        location: shopOwner.location
      });
      
      await restaurant.save();
      console.log(`✅ Auto-created restaurant for shop owner: ${shopOwner.shopName}`);
    }
    
    return restaurant;
  } catch (error) {
    // Handle duplicate key error - restaurant might have been created by another request
    if (error.code === 11000 || error.message.includes('duplicate key')) {
      console.log(`🔄 Restaurant already exists for shopOwnerId: ${shopOwnerId}, fetching existing...`);
      const existingRestaurant = await Restaurant.findOne({ shopOwnerId });
      if (existingRestaurant) {
        return existingRestaurant;
      }
    }
    throw error;
  }
};

/**
 * GET /api/shop/restaurant
 * Get restaurant profile (auto-create if missing)
 */
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    res.json({
      success: true,
      restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/shop/foods
 * Get all food items for this restaurant
 */
const getFoods = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const foods = await FoodItem.find({ restaurantId: restaurant._id })
      .sort({ category: 1, name: 1 });
    
    res.json({
      success: true,
      foods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/shop/foods
 * Create a new food item
 */
const createFood = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const { name, price, category, status } = req.body;
    
    const food = new FoodItem({
      restaurantId: restaurant._id,
      name,
      price,
      category,
      status: status || 'Available'
    });
    
    await food.save();
    
    res.status(201).json({
      success: true,
      food,
      message: 'Food item created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * PUT /api/shop/foods/:id
 * Update a food item
 */
const updateFood = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { name, price, category, status } = req.body;
    
    const food = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      { name, price, category, status },
      { new: true, runValidators: true }
    );
    
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    res.json({
      success: true,
      food,
      message: 'Food item updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE /api/shop/foods/:id
 * Delete a food item
 */
const deleteFood = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const food = await FoodItem.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId: restaurant._id 
    });
    
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    // Also delete related offers, combos, and polls
    await Offer.deleteMany({ foodItemId: food._id });
    await ComboMeal.deleteMany({ items: food._id });
    await Poll.deleteMany({ foodItemId: food._id });
    
    res.json({
      success: true,
      message: 'Food item and related data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/shop/offers
 * Get all offers for this restaurant
 */
const getOffers = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const offers = await Offer.find({ restaurantId: restaurant._id })
      .populate('foodItemId', 'name price category')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/shop/offers
 * Create a new offer
 */
const createOffer = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { foodItemId, discountPercent, validDate } = req.body;
    
    // Verify food item belongs to this restaurant and is available
    const foodItem = await FoodItem.findOne({ 
      _id: foodItemId, 
      restaurantId: restaurant._id,
      status: 'Available'
    });
    
    if (!foodItem) {
      return res.status(400).json({
        success: false,
        message: 'Food item not found or not available'
      });
    }
    
    const offer = new Offer({
      restaurantId: restaurant._id,
      foodItemId,
      discountPercent,
      validDate: new Date(validDate)
    });
    
    await offer.save();
    await offer.populate('foodItemId', 'name price category');

    try {
      const foodName = offer.foodItemId?.name || 'a meal';
      const shopName = restaurant?.shopName || req.user?.shopName || 'A restaurant';

      await broadcastNotificationToStudents({
        type: 'shop-offer-added',
        title: 'New food offer available',
        message: `${shopName} added an offer for ${foodName} (${discountPercent}% off).`,
        targetPath: '/restaurants'
      });
    } catch (notifyError) {
      console.error('Failed to broadcast offer notification:', notifyError.message);
    }
    
    res.status(201).json({
      success: true,
      offer,
      message: 'Offer created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * PUT /api/shop/offers/:id
 * Update an offer
 */
const updateOffer = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { discountPercent, validDate, isActive } = req.body;
    
    const offer = await Offer.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      { discountPercent, validDate: new Date(validDate), isActive },
      { new: true, runValidators: true }
    ).populate('foodItemId', 'name price category');
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    res.json({
      success: true,
      offer,
      message: 'Offer updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE /api/shop/offers/:id
 * Delete an offer
 */
const deleteOffer = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const offer = await Offer.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId: restaurant._id 
    });
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/shop/combos
 * Get all combo meals for this restaurant
 */
const getCombos = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const combos = await ComboMeal.find({ restaurantId: restaurant._id })
      .populate('items', 'name price category')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      combos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/shop/combos
 * Create a new combo meal
 */
const createCombo = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { name, items, totalPrice } = req.body;
    
    // Verify all food items belong to this restaurant and are available
    const foodItems = await FoodItem.find({ 
      _id: { $in: items }, 
      restaurantId: restaurant._id,
      status: 'Available'
    });
    
    if (foodItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Some food items not found or not available'
      });
    }
    
    const combo = new ComboMeal({
      restaurantId: restaurant._id,
      name,
      items,
      totalPrice
    });
    
    await combo.save();
    await combo.populate('items', 'name price category');
    
    res.status(201).json({
      success: true,
      combo,
      message: 'Combo meal created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * PUT /api/shop/combos/:id
 * Update a combo meal
 */
const updateCombo = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { name, items, totalPrice, status } = req.body;
    
    const combo = await ComboMeal.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      { name, items, totalPrice, status },
      { new: true, runValidators: true }
    ).populate('items', 'name price category');
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo meal not found'
      });
    }
    
    res.json({
      success: true,
      combo,
      message: 'Combo meal updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE /api/shop/combos/:id
 * Delete a combo meal
 */
const deleteCombo = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const combo = await ComboMeal.findOneAndDelete({ 
      _id: req.params.id, 
      restaurantId: restaurant._id 
    });
    
    if (!combo) {
      return res.status(404).json({
        success: false,
        message: 'Combo meal not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Combo meal deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/shop/orders
 * Get orders for this restaurant
 */
const getOrders = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = { restaurantId: restaurant._id };
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('studentId', 'fullName email')
      .populate({
        path: 'items.foodItemId',
        select: 'name price category'
      })
      .populate({
        path: 'items.comboMealId',
        select: 'name totalPrice'
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * PUT /api/shop/orders/:id/status
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { status } = req.body;

    const allowedStatuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const transitionMap = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['ready', 'cancelled'],
      ready: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    const allowedNextStatuses = transitionMap[order.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.status} to ${status}`
      });
    }

    order.status = status;
    await order.save();

    await order.populate('studentId', 'fullName email');

    const studentNotification = getStudentStatusNotificationContent(status, order.orderNumber);
    if (studentNotification) {
      try {
        await createOrderNotification({
          recipientId: order.studentId._id || order.studentId,
          recipientRole: "student",
          orderId: order._id,
          type: "order-status",
          title: studentNotification.title,
          message: studentNotification.message
        });
      } catch (notificationError) {
        console.error("Failed to create student notification:", notificationError.message);
      }
    }
    
    res.json({
      success: true,
      order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/shop/analytics
 * Get analytics data for this restaurant
 */
const getAnalytics = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { period = '30' } = req.query; // days
    
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - parseInt(period));
    
    // Total orders in period
    const totalOrders = await Order.countDocuments({
      restaurantId: restaurant._id,
      createdAt: { $gte: dateFrom }
    });
    
    // Total revenue in period
    const revenueData = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          createdAt: { $gte: dateFrom },
          status: { $in: ['completed', 'ready'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    
    // Popular items
    const popularItems = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          createdAt: { $gte: dateFrom }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.foodItemId',
          orderCount: { $sum: '$items.quantity' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'fooditems',
          localField: '_id',
          foreignField: '_id',
          as: 'foodItem'
        }
      },
      { $unwind: '$foodItem' },
      {
        $project: {
          name: '$foodItem.name',
          category: '$foodItem.category',
          orderCount: 1
        }
      }
    ]);
    
    // Daily sales trend
    const dailySales = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          createdAt: { $gte: dateFrom },
          status: { $in: ['completed', 'ready'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({
      success: true,
      analytics: {
        period: `${period} days`,
        totalOrders,
        totalRevenue,
        popularItems,
        dailySales,
        restaurant: restaurant.shopName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/shop/polls
 * Get active polls for this restaurant
 */
const getPolls = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const polls = await Poll.find({ 
      restaurantId: restaurant._id,
      isActive: true
    })
      .populate('foodItemId', 'name price category')
      .sort({ votes: -1 });
    
    res.json({
      success: true,
      polls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/shop/polls/:pollId/publish-offer
 * Publish offer based on poll results
 */
const publishOfferFromPoll = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { discountPercent } = req.body;
    
    const poll = await Poll.findOne({
      _id: req.params.pollId,
      restaurantId: restaurant._id,
      isActive: true
    }).populate('foodItemId');
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    // Create offer for next day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const offer = new Offer({
      restaurantId: restaurant._id,
      foodItemId: poll.foodItemId._id,
      discountPercent,
      validDate: tomorrow
    });
    
    await offer.save();
    
    // Deactivate the poll
    poll.isActive = false;
    await poll.save();
    
    await offer.populate('foodItemId', 'name price category');
    
    res.json({
      success: true,
      offer,
      message: 'Offer published successfully based on poll results'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/shop/polls
 * Create a new poll with multiple offer proposals
 */
const createPoll = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { title, description, proposals } = req.body;

    // Validation
    if (!title || !proposals || !Array.isArray(proposals) || proposals.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Poll must have a title and at least 2 proposals'
      });
    }

    if (proposals.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 proposals allowed per poll'
      });
    }

    const normalizedProposals = proposals.map((proposal) => ({
      ...proposal,
      proposedDiscount: Number(proposal.proposedDiscount)
    }));

    const hasInvalidProposal = normalizedProposals.some(
      (proposal) =>
        !proposal.foodItemId ||
        Number.isNaN(proposal.proposedDiscount) ||
        proposal.proposedDiscount < 0 ||
        proposal.proposedDiscount > 100
    );

    if (hasInvalidProposal) {
      return res.status(400).json({
        success: false,
        message: 'Each proposal must include a valid food item and discount between 0 and 100'
      });
    }

    const totalProposedDiscount = normalizedProposals.reduce(
      (total, proposal) => total + proposal.proposedDiscount,
      0
    );

    if (totalProposedDiscount > 100) {
      return res.status(400).json({
        success: false,
        message: 'Total proposed discount cannot exceed 100%'
      });
    }

    // Validate all food items belong to this restaurant
    const foodItemIds = normalizedProposals.map((p) => p.foodItemId);
    const validFoodItems = await FoodItem.find({
      _id: { $in: foodItemIds },
      restaurantId: restaurant._id,
      status: 'Available'
    });

    if (validFoodItems.length !== foodItemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some food items are not available or do not belong to your restaurant'
      });
    }

    // Create poll
    const poll = new Poll({
      restaurantId: restaurant._id,
      title,
      description
    });

    await poll.save();

    // Create poll proposals
    const pollProposals = await Promise.all(
      normalizedProposals.map(async (proposal) => {
        return new PollProposal({
          pollId: poll._id,
          foodItemId: proposal.foodItemId,
          proposedDiscount: proposal.proposedDiscount,
          description: proposal.description || `${proposal.proposedDiscount}% off`
        }).save();
      })
    );

    // Populate the poll with proposals and food items
    const populatedPoll = await Poll.findById(poll._id);
    const populatedProposals = await PollProposal.find({ pollId: poll._id })
      .populate('foodItemId', 'name price category');

    res.status(201).json({
      success: true,
      poll: populatedPoll,
      proposals: populatedProposals,
      message: 'Poll created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/shop/polls (enhanced)
 * Get all polls with their proposals for this restaurant
 */
const getPollsWithProposals = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    
    const polls = await Poll.find({ 
      restaurantId: restaurant._id,
      title: { $exists: true } // Only get new-style polls
    })
      .sort({ createdAt: -1 });

    // Get proposals for each poll
    const pollsWithProposals = await Promise.all(
      polls.map(async (poll) => {
        const proposals = await PollProposal.find({ pollId: poll._id })
          .populate('foodItemId', 'name price category')
          .sort({ votes: -1 });
        
        return {
          ...poll.toObject(),
          proposals,
          isExpired: poll.isExpired
        };
      })
    );

    res.json({
      success: true,
      polls: pollsWithProposals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * PUT /api/shop/polls/:id/status
 * Update poll status (activate/deactivate)
 */
const updatePollStatus = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { isActive } = req.body;

    const poll = await Poll.findOneAndUpdate(
      { 
        _id: req.params.id, 
        restaurantId: restaurant._id 
      },
      { isActive },
      { new: true }
    );

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.json({
      success: true,
      poll,
      message: `Poll ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/shop/polls/:id/create-offer
 * Create offer from the most voted proposal
 */
const createOfferFromPoll = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);
    const { proposalId, validDate } = req.body;

    const poll = await Poll.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const proposal = await PollProposal.findOne({
      _id: proposalId,
      pollId: poll._id
    }).populate('foodItemId');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Create offer based on the proposal
    const offer = new Offer({
      restaurantId: restaurant._id,
      foodItemId: proposal.foodItemId._id,
      discountPercent: proposal.proposedDiscount,
      validDate: new Date(validDate || new Date(Date.now() + 24 * 60 * 60 * 1000)) // Tomorrow by default
    });

    await offer.save();
    await offer.populate('foodItemId', 'name price category');

    // Deactivate the poll
    poll.isActive = false;
    await poll.save();

    res.json({
      success: true,
      offer,
      poll,
      message: 'Offer created successfully from poll results'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * DELETE /api/shop/polls/:id
 * Delete a poll and its proposals
 */
const deletePoll = async (req, res) => {
  try {
    const restaurant = await ensureRestaurantExists(req.user.id);

    const poll = await Poll.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Delete all proposals for this poll
    await PollProposal.deleteMany({ pollId: poll._id });
    
    // Delete the poll
    await Poll.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  ensureRestaurantExists,
  getRestaurant,
  getFoods,
  createFood,
  updateFood,
  deleteFood,
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getCombos,
  createCombo,
  updateCombo,
  deleteCombo,
  getOrders,
  updateOrderStatus,
  getAnalytics,
  getPolls,
  publishOfferFromPoll,
  // New poll management methods
  createPoll,
  getPollsWithProposals,
  updatePollStatus,
  createOfferFromPoll,
  deletePoll
};