import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import Toast from '../Toast/Toast';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

const FoodItem = ({ id, name, price, description, image }) => {
    const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);
    const [showToast, setShowToast] = useState(false);
    const navigate = useNavigate();

    const totalCartItems = Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);

    const handleAddToCartFromImage = (e) => {
        e.stopPropagation(); // Prevents bubbling up to other click handlers
        addToCart(id);
        setShowToast(true);
    };

    const handleRemoveFromCart = (e) => {
        e.stopPropagation(); // Prevents bubbling up to the card click handler
        removeFromCart(id);
    };

    const handleAddMoreToCart = (e) => {
        e.stopPropagation(); // Prevents bubbling up to the card click handler
        addToCart(id);
    };

    const handleNavigateToCart = () => {
        navigate('/cart');
    };

    return (
        <div className="food-item">
            <div className="food-item-img-container">
                <img
                    className="food-item-image"
                    src={image}
                    alt={name}
                    onClick={handleAddToCartFromImage} // Add to cart when image is clicked
                />
                {!cartItems[id] ? (
                    <img
                        className="add"
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(id);
                            setShowToast(true);
                        }}
                        src={assets.add_icon_white}
                        alt="Add to cart"
                    />
                ) : (
                    <div className="food-item-counter">
                        <img
                            onClick={handleRemoveFromCart}
                            src={assets.remove_icon_red}
                            alt="Remove from cart"
                        />
                        <p>{cartItems[id]}</p>
                        <img
                            onClick={handleAddMoreToCart}
                            src={assets.add_icon_green}
                            alt="Add more to cart"
                        />
                    </div>
                )}
            </div>
            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p>
                    <img src={assets.rating_starts} alt="Rating stars" />
                </div>
                <p className="food-item-desc">{description}</p>
                <p className="food-item-price">{formatCurrency(price)}</p>
            </div>
            {showToast && <Toast message={`Menu telah ditambahkan ke keranjang`} onClose={() => setShowToast(false)} />}

            {/* Floating action button with item count */}
            <Fab
                color="primary"
                aria-label="go to cart"
                onClick={handleNavigateToCart}
                sx={{
                    backgroundColor: 'tomato',
                    color: 'white',
                    boxShadow: 'none',
                    '&:hover': {
                        backgroundColor: '#ff6347',
                        boxShadow: 'none',
                    },
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                }}
            >
                <Badge badgeContent={totalCartItems} color="error">
                    <ShoppingCartIcon />
                </Badge>
            </Fab>
        </div>
    );
};

FoodItem.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
};

export default FoodItem;
