import React, { useState, useContext } from "react";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import OrderConfirmation from "./pages/OrderConfirmation/OrderConfirmation";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import Toast from "./components/Toast/Toast";
import Fab from "@mui/material/Fab";
import Badge from "@mui/material/Badge";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { StoreContext } from "./context/StoreContext";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const { toastMessage, setToastMessage, cartItems } = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();

  const totalCartItems = cartItems
    ? Object.values(cartItems).reduce((total, quantity) => total + quantity, 0)
    : 0;

  const showFloatingCart = location.pathname !== "/cart" && totalCartItems > 0;

  return (
    <>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : null}

      {/* Global Toast at screen level */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage("")}
        />
      )}

      {/* Global Floating Cart FAB at screen level */}
      {showFloatingCart && (
        <Fab
          color="primary"
          aria-label="ke keranjang"
          onClick={() => navigate("/cart")}
          sx={{
            backgroundColor: "#ff6347",
            color: "white",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.22)",
            "&:hover": {
              backgroundColor: "#e05338",
            },
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1000,
          }}
        >
          <Badge badgeContent={totalCartItems} color="error">
            <ShoppingCartIcon />
          </Badge>
        </Fab>
      )}

      <div className="app">
        <Navbar setShowLogin={setShowLogin} />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/order-confirmation/:orderId"
            element={<OrderConfirmation />}
          />
          <Route path="/verify" element={<Verify />} />
          <Route path="/myorders" element={<MyOrders />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default App;
