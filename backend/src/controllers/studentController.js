const Restaurant = require("../models/Restaurant");
const FoodItem = require("../models/FoodItem");
const Offer = require("../models/Offer");
const ComboMeal = require("../models/ComboMeal");
const Order = require("../models/Order");
const FavoriteRestaurant = require("../models/FavoriteRestaurant");
const Rating = require("../models/Rating");
const Poll = require("../models/Poll");
const PollProposal = require("../models/PollProposal");
const Transaction = require("../models/Transaction");
const Expense = require("../models/Expense");


/**
 * GET /api/student/restaurants
 * Get all restaurants
 */
const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({})
      .populate('shopOwnerId', 'fullName')
      .sort({ shopName: 1 });
    
    // Get ratings for each restaurant
    const restaurantsWithRatings = await Promise.all(
      restaurants.map(async (restaurant) => {
        const ratings = await Rating.aggregate([
          { $match: { restaurantId: restaurant._id } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalRatings: { $sum: 1 }
            }
          }
        ]);
        
        const restaurantObj = restaurant.toObject();
        restaurantObj.averageRating = ratings.length > 0 ? ratings[0].averageRating : 0;
        restaurantObj.totalRatings = ratings.length > 0 ? ratings[0].totalRatings : 0;
        
        return restaurantObj;
      })
    );
    
    res.json({
      success: true,
      restaurants: restaurantsWithRatings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/student/restaurant/:id/menu
 * Get menu for a specific restaurant
 */
const getRestaurantMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Get food items
    const foodItems = await FoodItem.find({ 
      restaurantId: restaurant._id,
      status: 'Available'
    }).sort({ category: 1, name: 1 });
    
    // Get combo meals
    const comboMeals = await ComboMeal.find({ 
      restaurantId: restaurant._id,
      status: 'Available'
    }).populate('items', 'name price category');
    
    // Get current offers
    const offers = await Offer.find({
      restaurantId: restaurant._id,
      isActive: true,
      validDate: { $gte: new Date() }
    }).populate('foodItemId', 'name price category');
    
    // Organize food by category - restaurants serve all categories throughout the day
    const currentHour = new Date().getHours();
    let suggestedCategory = 'snack';
    
    // Suggest category based on time, but all categories remain available
    if (currentHour >= 6 && currentHour < 11) {
      suggestedCategory = 'breakfast';
    } else if (currentHour >= 11 && currentHour < 16) {
      suggestedCategory = 'lunch';
    } else if (currentHour >= 16 && currentHour < 21) {
      suggestedCategory = 'dinner';
    }
    
    const categorizedMenu = {
      breakfast: foodItems.filter(item => item.category === 'breakfast'),
      lunch: foodItems.filter(item => item.category === 'lunch'),
      dinner: foodItems.filter(item => item.category === 'dinner'),
      snack: foodItems.filter(item => item.category === 'snack'),
      drink: foodItems.filter(item => item.category === 'drink'),
    };
    
    res.json({
      success: true,
      restaurant,
      menu: {
        categorizedMenu,
        comboMeals,
        offers,
        suggestedCategory,
        currentTime: new Date()
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
 * GET /api/student/budget-meals
 * Smart Budget Meal Finder
 */
const getBudgetMeals = async (req, res) => {
  try {
    const { budget, category, type } = req.query;
    
    if (!budget) {
      return res.status(400).json({
        success: false,
        message: 'Budget amount is required'
      });
    }
    
    const budgetAmount = parseFloat(budget);
    let results = {};
    
    if (type === 'combo' || !type) {
      // Find combo meals within budget
      let comboQuery = { 
        totalPrice: { $lte: budgetAmount },
        status: 'Available'
      };
      
      const combos = await ComboMeal.find(comboQuery)
        .populate('items', 'name price category')
        .populate('restaurantId', 'shopName location')
        .sort({ totalPrice: 1 });
      
      results.comboMeals = combos;
    }
    
    if (type === 'individual' || !type) {
      // Find individual food items within budget
      let foodQuery = { 
        price: { $lte: budgetAmount },
        status: 'Available'
      };
      
      if (category) {
        foodQuery.category = category;
      }
      
      const foodItems = await FoodItem.find(foodQuery)
        .populate('restaurantId', 'shopName location')
        .sort({ price: 1 });
      
      results.foodItems = foodItems;
    }
    
    res.json({
      success: true,
      budget: budgetAmount,
      category: category || 'all',
      type: type || 'all',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/student/order
 * Create a new order
 */
const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, totalAmount } = req.body;
    const studentId = req.user.id;
    
    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Verify all items are available and calculate total
    let calculatedTotal = 0;
    
    for (let item of items) {
      if (item.foodItemId) {
        const foodItem = await FoodItem.findOne({
          _id: item.foodItemId,
          restaurantId: restaurantId,
          status: 'Available'
        });
        
        if (!foodItem) {
          return res.status(400).json({
            success: false,
            message: `Food item ${item.foodItemId} not found or not available`
          });
        }
        
        // Use the price sent by the client (which may be a discounted offer price).
        // The totalAmount check below ensures the client cannot lie about the sum.
        const itemPrice = item.price != null ? item.price : foodItem.price;
        calculatedTotal += itemPrice * item.quantity;
      } else if (item.comboMealId) {
        const comboMeal = await ComboMeal.findOne({
          _id: item.comboMealId,
          restaurantId: restaurantId,
          status: 'Available'
        });
        
        if (!comboMeal) {
          return res.status(400).json({
            success: false,
            message: `Combo meal ${item.comboMealId} not found or not available`
          });
        }
        
        calculatedTotal += comboMeal.totalPrice * item.quantity;
      }
    }
    
    // Verify total amount
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total amount mismatch'
      });
    }
    
    const order = new Order({
      studentId,
      restaurantId,
      items,
      totalAmount
    });
    
    await order.save();
    await order.populate([
      { path: 'restaurantId', select: 'shopName location' },
      { path: 'items.foodItemId', select: 'name price category' },
      { path: 'items.comboMealId', select: 'name totalPrice' }
    ]);

    try {
      await Transaction.create({
        userId: studentId,
        type: "expense",
        category: "Food",
        amount: totalAmount,
        description: `Order ${order._id}`,
        date: order.createdAt || new Date(),
      });
    } catch (transactionError) {
      console.error("Failed to log order transaction:", transactionError.message);
    }

    try {
      await Expense.create({
        userId: studentId,
        amount: totalAmount,
        category: "Food",
        description: `Order ${order._id}`,
        date: order.createdAt || new Date(),
      });
    } catch (expenseError) {
      console.error("Failed to log order expense:", expenseError.message);
    }

    res.status(201).json({
      success: true,
      order,
      message: 'Order placed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/student/orders
 * Get student's order history
 */
const getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = { studentId: req.user.id };
    if (status) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('restaurantId', 'shopName location')
      .populate('items.foodItemId', 'name price category')
      .populate('items.comboMealId', 'name totalPrice')
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
 * POST /api/student/favorite
 * Add/remove restaurant from favorites
 */
const toggleFavorite = async (req, res) => {
  try {
    const { restaurantId } = req.body;
    const studentId = req.user.id;
    
    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Check if already favorited
    const existingFavorite = await FavoriteRestaurant.findOne({
      studentId,
      restaurantId
    });
    
    if (existingFavorite) {
      // Remove from favorites
      await FavoriteRestaurant.deleteOne({ _id: existingFavorite._id });
      
      res.json({
        success: true,
        action: 'removed',
        message: 'Restaurant removed from favorites'
      });
    } else {
      // Add to favorites
      const favorite = new FavoriteRestaurant({
        studentId,
        restaurantId
      });
      
      await favorite.save();
      
      res.json({
        success: true,
        action: 'added',
        message: 'Restaurant added to favorites'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/student/favorites
 * Get student's favorite restaurants
 */
const getFavorites = async (req, res) => {
  try {
    const favorites = await FavoriteRestaurant.find({ 
      studentId: req.user.id 
    })
      .populate({
        path: 'restaurantId',
        populate: {
          path: 'shopOwnerId',
          select: 'fullName'
        }
      })
      .sort({ createdAt: -1 });
    
    // Get ratings for each favorite restaurant
    const favoritesWithRatings = await Promise.all(
      favorites.map(async (favorite) => {
        const ratings = await Rating.aggregate([
          { $match: { restaurantId: favorite.restaurantId._id } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalRatings: { $sum: 1 }
            }
          }
        ]);
        
        const favoriteObj = favorite.toObject();
        favoriteObj.restaurantId.averageRating = ratings.length > 0 ? ratings[0].averageRating : 0;
        favoriteObj.restaurantId.totalRatings = ratings.length > 0 ? ratings[0].totalRatings : 0;
        
        return favoriteObj;
      })
    );
    
    res.json({
      success: true,
      favorites: favoritesWithRatings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/student/rating
 * Rate a restaurant
 */
const rateRestaurant = async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;
    const studentId = req.user.id;
    
    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }
    
    // Check if student has ordered from this restaurant
    const hasOrdered = await Order.findOne({
      studentId,
      restaurantId,
      status: { $in: ['completed', 'ready'] }
    });
    
    if (!hasOrdered) {
      return res.status(400).json({
        success: false,
        message: 'You can only rate restaurants you have ordered from'
      });
    }
    
    // Update or create rating
    let ratingDoc = await Rating.findOne({ studentId, restaurantId });
    
    if (ratingDoc) {
      ratingDoc.rating = rating;
      ratingDoc.comment = comment;
      await ratingDoc.save();
    } else {
      ratingDoc = new Rating({
        studentId,
        restaurantId,
        rating,
        comment
      });
      await ratingDoc.save();
    }
    
    res.json({
      success: true,
      rating: ratingDoc,
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/student/offers
 * Get current active offers
 */
const getCurrentOffers = async (req, res) => {
  try {
    const { category, restaurantId } = req.query;
    
    let query = {
      isActive: true,
      validDate: { $gte: new Date() }
    };
    
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }
    
    const offers = await Offer.find(query)
      .populate('restaurantId', 'shopName location')
      .populate('foodItemId', 'name price category')
      .sort({ discountPercent: -1 });
    
    // Filter by category if specified
    let filteredOffers = offers;
    if (category) {
      filteredOffers = offers.filter(offer => 
        offer.foodItemId.category === category
      );
    }
    
    res.json({
      success: true,
      offers: filteredOffers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/student/poll/vote
 * Vote for today's special
 */
const voteInPoll = async (req, res) => {
  try {
    const { restaurantId, foodItemId } = req.body;
    const studentId = req.user.id;
    
    // Verify restaurant and food item exist
    const restaurant = await Restaurant.findById(restaurantId);
    const foodItem = await FoodItem.findOne({
      _id: foodItemId,
      restaurantId: restaurantId,
      status: 'Available'
    });
    
    if (!restaurant || !foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant or food item not found'
      });
    }
    
    // Find or create poll for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let poll = await Poll.findOne({
      restaurantId,
      foodItemId,
      pollDate: { $gte: today },
      isActive: true
    });
    
    if (!poll) {
      poll = new Poll({
        restaurantId,
        foodItemId,
        votes: 0,
        voters: [],
        pollDate: new Date()
      });
    }
    
    // Check if student already voted for this food item today
    if (poll.voters.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this item today'
      });
    }
    
    // Add vote
    poll.votes += 1;
    poll.voters.push(studentId);
    await poll.save();
    
    res.json({
      success: true,
      poll,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/student/poll/:restaurantId
 * Get current poll results for a restaurant
 */
const getPollResults = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const polls = await Poll.find({
      restaurantId,
      pollDate: { $gte: today },
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
 * GET /api/student/polls/:restaurantId
 * Get active polls with proposals for a restaurant
 */
const getRestaurantPolls = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    // Find active polls with proposals
    const polls = await Poll.find({
      restaurantId,
      isActive: true,
      title: { $exists: true }, // Only get new-style polls
      expiresAt: { $gt: new Date() } // Not expired
    }).sort({ createdAt: -1 });

    // Get proposals for each poll
    const pollsWithProposals = await Promise.all(
      polls.map(async (poll) => {
        const proposals = await PollProposal.find({ pollId: poll._id })
          .populate('foodItemId', 'name price category')
          .sort({ votes: -1 });
        
        return {
          ...poll.toObject(),
          proposals,
          hasUserVoted: poll.hasUserVoted(req.user.id)
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
 * POST /api/student/polls/vote-proposal
 * Vote for a specific proposal in a poll
 */
const voteInPollProposal = async (req, res) => {
  try {
    const { pollId, proposalId } = req.body;
    const studentId = req.user.id;

    // Find the poll and proposal
    const poll = await Poll.findOne({
      _id: pollId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found or expired'
      });
    }

    const proposal = await PollProposal.findOne({
      _id: proposalId,
      pollId: poll._id
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    // Check if student already voted in this poll
    if (poll.hasUserVoted(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll'
      });
    }

    // Check if student already voted for this specific proposal
    if (proposal.voters.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted for this proposal'
      });
    }

    // Add vote to proposal
    proposal.votes += 1;
    proposal.voters.push(studentId);
    await proposal.save();

    // Add voter to poll
    poll.totalVotes += 1;
    poll.voters.push(studentId);
    await poll.save();

    // Return updated proposal
    await proposal.populate('foodItemId', 'name price category');

    res.json({
      success: true,
      proposal,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getRestaurants,
  getRestaurantMenu,
  getBudgetMeals,
  createOrder,
  getOrderHistory,
  toggleFavorite,
  getFavorites,
  rateRestaurant,
  getCurrentOffers,
  voteInPoll,
  getPollResults,
  // New enhanced poll methods
  getRestaurantPolls,
  voteInPollProposal
};
