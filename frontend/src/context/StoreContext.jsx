import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const [cartItems, setCartItems] = useState({});
    const [promoCode, setPromoCode] = useState("");
    const [discount, setDiscount] = useState(0);
    const url = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;
    const [token, setToken] = useState("");
    const [food_list, setFoodList] = useState([]);
    const [tableNumber, setTableNumber] = useState(localStorage.getItem("tableNumber") || "");

    // Update localStorage whenever tableNumber changes
    useEffect(() => {
        localStorage.setItem("tableNumber", tableNumber);
    }, [tableNumber]);

    // Add to cart functionality
    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
        } else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }
        if (token) {
            await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
        }
    };

    // Remove from cart functionality
    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
        if (token) {
            await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
        }
    };

    // Total cart amount calculation
    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item);
                totalAmount += itemInfo.price * cartItems[item];
            }
        }
        return totalAmount;
    };

    // Handle promo code and calculate discount
    const handlePromoCode = (code) => {
        if (code === "MERDEKA") {
            setPromoCode(code);
            setDiscount(getTotalCartAmount() * 0.30); // 30% discount
        } else if (code === "SPECIAL20") {
            setPromoCode(code);
            setDiscount(getTotalCartAmount() * 0.20); // 20% discount
        } else {
            setPromoCode("");
            setDiscount(0);
        }
    };

    // Recalculate discount whenever cart or promo code changes
    useEffect(() => {
        if (promoCode === "MERDEKA") {
            setDiscount(getTotalCartAmount() * 0.30); // 30% discount
        } else if (promoCode === "SPECIAL20") {
            setDiscount(getTotalCartAmount() * 0.20); // 20% discount
        } else {
            setDiscount(0);
        }
    }, [cartItems, promoCode]); // Update discount when cartItems or promoCode changes

    // Fetch food list from API
    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url + "/api/food/list");
            const foodList = response.data.data.map(item => ({
                ...item,
                price: ((item.price)) 
            }));
            setFoodList(foodList);
        } catch (error) {
            console.error("Error fetching food list", error);
        }
    };

    const loadCartData = async (token) => {
        const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
        setCartItems(response.data.cartData);
    };

    useEffect(() => {
        async function loadData() {
            await fetchFoodList();
            if (localStorage.getItem("token")) {
                setToken(localStorage.getItem("token"));
                await loadCartData(localStorage.getItem("token"));
            }
        }
        loadData();
    }, []);

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        handlePromoCode, // Expose the promo code handler
        discount,        // Expose the discount
        promoCode,       // Expose the applied promo code
        tableNumber,     // Expose the table number
        setTableNumber, 
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;