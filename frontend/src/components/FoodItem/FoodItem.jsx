import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};

const FoodItem = ({ id, name, price, description, image, available = true }) => {
    const { cartItems, addToCart, removeFromCart, showToast } = useContext(StoreContext);

    const isOutOfStock = available === false;

    const handleAddToCartFromImage = (e) => {
        e.stopPropagation();
        if (isOutOfStock) {
            if (showToast) showToast(`Maaf, "${name}" saat ini sedang habis.`);
            return;
        }
        addToCart(id);
    };

    const handleRemoveFromCart = (e) => {
        e.stopPropagation();
        removeFromCart(id);
    };

    const handleAddMoreToCart = (e) => {
        e.stopPropagation();
        if (isOutOfStock) return;
        addToCart(id);
    };

    return (
        <div className={`food-item ${isOutOfStock ? 'food-item-unavailable' : ''}`}>
            <div className="food-item-img-container">
                <img
                    className={`food-item-image ${isOutOfStock ? 'image-dimmed' : ''}`}
                    src={image}
                    alt={name}
                    onClick={handleAddToCartFromImage}
                />
                
                {isOutOfStock ? (
                    <div className="out-of-stock-overlay" onClick={handleAddToCartFromImage}>
                        <span className="out-of-stock-badge">Stok Habis</span>
                    </div>
                ) : !cartItems[id] ? (
                    <img
                        className="add"
                        onClick={(e) => {
                            e.stopPropagation();
                            addToCart(id);
                        }}
                        src={assets.add_icon_white}
                        alt="Tambah ke keranjang"
                    />
                ) : (
                    <div className="food-item-counter">
                        <img
                            onClick={handleRemoveFromCart}
                            src={assets.remove_icon_red}
                            alt="Kurangi"
                        />
                        <p>{cartItems[id]}</p>
                        <img
                            onClick={handleAddMoreToCart}
                            src={assets.add_icon_green}
                            alt="Tambah"
                        />
                    </div>
                )}
            </div>

            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p>
                    <img src={assets.rating_starts} alt="Rating bintang" />
                </div>
                <p className="food-item-desc">{description}</p>
                <div className="food-item-bottom">
                    <p className="food-item-price">{formatCurrency(price)}</p>
                    {isOutOfStock && (
                        <span className="food-item-stock-tag">Habis</span>
                    )}
                </div>
            </div>
        </div>
    );
};

FoodItem.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    available: PropTypes.bool,
};

export default FoodItem;
