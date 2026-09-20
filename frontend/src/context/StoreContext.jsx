import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const [cartItems, setCartItems] = useState({});
    const [promoCode, setPromoCode] = useState("");
    const [discount, setDiscount] = useState(0);
    // Determine backend URL: use window.location.hostname in dev so mobile devices connect automatically
    const getBackendUrl = () => {
        const envUrl = import.meta.env.VITE_REACT_APP_BACKEND_BASEURL;
        if (envUrl && !envUrl.includes("localhost")) {
            return envUrl;
        }
        if (typeof window !== "undefined" && window.location.hostname && window.location.hostname !== "localhost") {
            return `http://${window.location.hostname}:4000`;
        }
        return envUrl || "http://localhost:4000";
    };
    const url = getBackendUrl();
    const [token, setToken] = useState("");
    const [food_list, setFoodList] = useState([]);
    const [tableNumber, setTableNumber] = useState(localStorage.getItem("tableNumber") || "");

    // Update localStorage whenever tableNumber changes
    useEffect(() => {
        localStorage.setItem("tableNumber", tableNumber);
    }, [tableNumber]);

    const [toastMessage, setToastMessage] = useState("");

    const showToast = (msg) => {
        setToastMessage(msg);
    };

    // Add to cart functionality
    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
        } else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }
        setToastMessage("Menu telah ditambahkan ke keranjang");
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
                if (itemInfo && itemInfo.price !== undefined) {
                    totalAmount += Number(itemInfo.price) * cartItems[item];
                }
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
    }, [cartItems, promoCode, food_list]); // Update discount when cartItems, food_list or promoCode changes

    // Fetch food list from API
    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url + "/api/food/list");
            if (response.data && response.data.data) {
                const foodList = response.data.data.map(item => ({
                    ...item,
                    price: Number(item.price) 
                }));
                setFoodList(foodList);

                // Auto-cleanup stale items from cart that were deleted from admin
                const validIds = new Set(foodList.map(item => item._id));
                setCartItems(prevCart => {
                    let hasChanges = false;
                    const cleanedCart = {};
                    for (const id in prevCart) {
                        if (validIds.has(id) && prevCart[id] > 0) {
                            cleanedCart[id] = prevCart[id];
                        } else if (prevCart[id] > 0) {
                            hasChanges = true;
                        }
                    }
                    return hasChanges ? cleanedCart : prevCart;
                });
            }
        } catch (error) {
            console.error("Error fetching food list", error);
        }
    };

    const loadCartData = async (token) => {
        try {
            const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
            if (response.data && response.data.cartData) {
                setCartItems(response.data.cartData);
            }
        } catch (error) {
            console.error("Error loading cart data", error);
        }
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
        toastMessage,    // Expose global toast message
        setToastMessage,
        showToast,
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;