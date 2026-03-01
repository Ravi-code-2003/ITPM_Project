import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
};

// Action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_RESTAURANT: 'SET_RESTAURANT',
  LOAD_CART: 'LOAD_CART',
};

// Reducer
const cartReducer = (state, action) => {
  console.log('CartReducer action:', action.type, action.payload);
  console.log('CartReducer current state:', state);
  
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { item, isCombo, restaurantId, restaurantName } = action.payload;
      console.log('Processing ADD_ITEM:', { item, isCombo, restaurantId, restaurantName });
      
      // If cart has items from different restaurant, clear it first
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        console.log('Clearing cart due to different restaurant');
        return {
          items: [{
            id: item._id,
            name: item.name,
            price: isCombo ? item.totalPrice : item.price,
            quantity: 1,
            isCombo,
            category: isCombo ? 'combo' : item.category,
          }],
          restaurantId,
          restaurantName,
        };
      }

      // Check if item already exists in cart
      const existingItemIndex = state.items.findIndex(cartItem => 
        cartItem.id === item._id && cartItem.isCombo === isCombo
      );

      if (existingItemIndex >= 0) {
        console.log('Updating existing item quantity');
        // Update quantity of existing item
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        
        const newState = {
          ...state,
          items: updatedItems,
          restaurantId: restaurantId || state.restaurantId,
          restaurantName: restaurantName || state.restaurantName,
        };
        console.log('Updated state with existing item:', newState);
        return newState;
      } else {
        console.log('Adding new item to cart');
        // Add new item
        const newState = {
          ...state,
          items: [...state.items, {
            id: item._id,
            name: item.name,
            price: isCombo ? item.totalPrice : item.price,
            quantity: 1,
            isCombo,
            category: isCombo ? 'combo' : item.category,
          }],
          restaurantId: restaurantId || state.restaurantId,
          restaurantName: restaurantName || state.restaurantName,
        };
        console.log('Updated state with new item:', newState);
        return newState;
      }
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { itemId, isCombo, change } = action.payload;
      
      return {
        ...state,
        items: state.items.map(item => {
          if (item.id === itemId && item.isCombo === isCombo) {
            const newQuantity = Math.max(0, item.quantity + change);
            return { ...item, quantity: newQuantity };
          }
          return item;
        }).filter(item => item.quantity > 0)
      };
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const { itemId, isCombo } = action.payload;
      
      const updatedItems = state.items.filter(item => 
        !(item.id === itemId && item.isCombo === isCombo)
      );
      
      return {
        ...state,
        items: updatedItems,
        // Clear restaurant info if no items left
        restaurantId: updatedItems.length === 0 ? null : state.restaurantId,
        restaurantName: updatedItems.length === 0 ? null : state.restaurantName,
      };
    }
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        items: [],
        restaurantId: null,
        restaurantName: null,
      };
      
    case CART_ACTIONS.SET_RESTAURANT: {
      const { restaurantId, restaurantName } = action.payload;
      return {
        ...state,
        restaurantId,
        restaurantName,
      };
    }
    
    case CART_ACTIONS.LOAD_CART:
      return action.payload || initialState;
      
    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('studentCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('studentCart', JSON.stringify(state));
  }, [state]);

  // Action creators
  const addToCart = (item, isCombo = false, restaurantId = null, restaurantName = null) => {
    console.log('CartContext addToCart called:', { item, isCombo, restaurantId, restaurantName });
    
    // If adding from different restaurant, confirm with user
    if (state.restaurantId && state.restaurantId !== restaurantId && state.items.length > 0) {
      const confirmed = window.confirm(
        `You have items from ${state.restaurantName} in your cart. Adding items from a different restaurant will clear your current cart. Continue?`
      );
      if (!confirmed) {
        console.log('User declined to clear cart');
        return;
      }
    }

    console.log('Dispatching ADD_ITEM action');
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { item, isCombo, restaurantId, restaurantName }
    });
    
    toast.success(`${item.name} added to cart`);
    console.log('Cart state after add:', state);
  };

  const updateQuantity = (itemId, isCombo, change) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { itemId, isCombo, change }
    });
  };

  const removeFromCart = (itemId, isCombo) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { itemId, isCombo }
    });
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    toast.success('Cart cleared');
  };

  const setRestaurant = (restaurantId, restaurantName) => {
    dispatch({
      type: CART_ACTIONS.SET_RESTAURANT,
      payload: { restaurantId, restaurantName }
    });
  };

  // Computed values
  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    const count = state.items.reduce((total, item) => total + item.quantity, 0);
    console.log('Cart count calculated:', count, 'from items:', state.items);
    return count;
  };

  const value = {
    cart: state,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setRestaurant,
    getCartTotal,
    getCartCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  console.log('useCart called, current cart:', context.cart);
  return context;
};

export default CartContext;