import { describe, test, expect } from '@jest/globals';

/**
 * Pure functions matching StoreContext cart logic
 */
export function calculateTotalCartAmount(cartItems, foodList) {
  let totalAmount = 0;
  for (const item in cartItems) {
    if (cartItems[item] > 0) {
      const itemInfo = foodList.find((product) => String(product._id) === String(item));
      if (itemInfo && itemInfo.price !== undefined) {
        totalAmount += Number(itemInfo.price) * cartItems[item];
      }
    }
  }
  return totalAmount;
}

export function cleanupStaleCartItems(prevCart, foodList) {
  const validIds = new Set(foodList.map(item => String(item._id)));
  const cleanedCart = {};
  for (const id in prevCart) {
    if (validIds.has(id) && prevCart[id] > 0) {
      cleanedCart[id] = prevCart[id];
    }
  }
  return cleanedCart;
}

export function addToCartLogic(cartItems, itemId) {
  const prevCount = cartItems[itemId] || 0;
  return {
    ...cartItems,
    [itemId]: prevCount + 1
  };
}

export function removeFromCartLogic(cartItems, itemId) {
  const prevCount = cartItems[itemId] || 0;
  const newCount = Math.max(0, prevCount - 1);
  const updated = { ...cartItems, [itemId]: newCount };
  if (newCount === 0) {
    delete updated[itemId];
  }
  return updated;
}

describe('Unit Tests: Cart Item Management & Total Calculation', () => {
  const sampleFoods = [
    { _id: 'food_1', name: 'Nasi Goreng Spesial', price: 25000 },
    { _id: 'food_2', name: 'Es Teh Manis', price: 5000 },
    { _id: 'food_3', name: 'Kopi Bujang', price: 15000 }
  ];

  test('calculateTotalCartAmount calculates correct sum of items', () => {
    const cart = {
      food_1: 2, // 25,000 * 2 = 50,000
      food_2: 3, // 5,000 * 3 = 15,000
      food_3: 1  // 15,000 * 1 = 15,000
    };
    const total = calculateTotalCartAmount(cart, sampleFoods);
    expect(total).toBe(80000);
  });

  test('calculateTotalCartAmount returns 0 for empty cart', () => {
    expect(calculateTotalCartAmount({}, sampleFoods)).toBe(0);
  });

  test('calculateTotalCartAmount ignores deleted/unknown food items gracefully', () => {
    const cart = {
      food_1: 1, // 25,000
      unknown_food: 5 // should be ignored
    };
    expect(calculateTotalCartAmount(cart, sampleFoods)).toBe(25000);
  });

  test('addToCartLogic increments quantity properly', () => {
    let cart = {};
    cart = addToCartLogic(cart, 'food_1');
    expect(cart['food_1']).toBe(1);

    cart = addToCartLogic(cart, 'food_1');
    expect(cart['food_1']).toBe(2);

    cart = addToCartLogic(cart, 'food_2');
    expect(cart['food_2']).toBe(1);
    expect(cart['food_1']).toBe(2);
  });

  test('removeFromCartLogic decrements quantity and removes 0-count items', () => {
    let cart = { food_1: 2, food_2: 1 };
    
    cart = removeFromCartLogic(cart, 'food_1');
    expect(cart['food_1']).toBe(1);

    cart = removeFromCartLogic(cart, 'food_2');
    expect(cart['food_2']).toBeUndefined(); // removed when reaching 0
  });

  test('cleanupStaleCartItems strips out items no longer in menu database', () => {
    const cartWithStaleItem = {
      food_1: 2,
      deleted_item_999: 4
    };
    const cleaned = cleanupStaleCartItems(cartWithStaleItem, sampleFoods);
    expect(cleaned).toEqual({ food_1: 2 });
    expect(cleaned['deleted_item_999']).toBeUndefined();
  });
});
