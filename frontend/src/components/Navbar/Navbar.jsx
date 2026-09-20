import React, { useContext, useState, useRef, useEffect } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import Swal from 'sweetalert2';

const Navbar = ({setShowLogin}) => {

    const [menu, setMenu] = useState("home");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const { cartItems, token, setToken, tableNumber } = useContext(StoreContext);

    const navigate = useNavigate();
    const location = useLocation();

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        if (isProfileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isProfileOpen]);

    // Calculate total quantity of items in cart
    const totalCartCount = cartItems 
        ? Object.values(cartItems).reduce((sum, qty) => sum + qty, 0) 
        : 0;

    const logout = () => {
        Swal.fire({
            title: "Keluar dari aplikasi?",
            text: "Apakah Anda yakin ingin logout?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, keluar",
            cancelButtonText: "Batal",
            customClass: {
                popup: "small-swal-popup",
                title: "small-swal-title",
                content: "small-swal-content",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("token");
                setToken("");
                navigate("/");
                Swal.fire({
                    title: "Berhasil",
                    text: "Anda telah logout.",
                    icon: "success",
                    confirmButtonColor: "#3085d6",
                    customClass: {
                        popup: "small-swal-popup",
                        title: "small-swal-title",
                        content: "small-swal-content",
                    },
                });
            }
        })
    }

  return (
    <div className='navbar'>
        <div className="navbar-left">
            <Link to='/'><img src={assets.logo} alt="Bujang" className="logo" /></Link>
            {tableNumber && (
                <div className="navbar-table-pill" title={`Terhubung ke Meja ${tableNumber}`}>
                    <span>Meja {tableNumber}</span>
                </div>
            )}
        </div>

        <ul className="navbar-menu">
            <Link to='/' onClick={()=>setMenu("home")} className={menu==="home"?"active":""}>promo</Link>
            <a href='#explore-menu' onClick={()=>setMenu("menu")} className={menu==="menu"?"active":""}>menu</a>
            <a href='#footer' onClick={()=>setMenu("contact-us")} className={menu==="contact-us"?"active":""}>kontak</a>
        </ul>

        <div className="navbar-right">
            <Link 
                to='/cart' 
                className={`navbar-cart-btn ${location.pathname === '/cart' ? 'active' : ''}`} 
                aria-label="Keranjang Belanja"
            >
                <img src={assets.basket_icon} alt="Cart" />
                {totalCartCount > 0 && (
                    <span className="navbar-cart-badge">{totalCartCount}</span>
                )}
            </Link>

            {!token ? (
                <button className="navbar-signin-btn" onClick={()=>setShowLogin(true)}>
                    Sign In
                </button>
            ) : (
                <div className='navbar-profile' ref={profileRef}>
                    <button 
                        type="button"
                        className={`navbar-profile-btn ${isProfileOpen ? 'active' : ''}`}
                        aria-label="Profil Akun"
                        onClick={() => setIsProfileOpen(prev => !prev)}
                    >
                        <img src={assets.profile_icon} alt="Profile" />
                    </button>
                    {isProfileOpen && (
                        <ul className="nav-profile-dropdown">
                            <li onClick={() => { setIsProfileOpen(false); navigate('/myorders'); }}>
                                <img src={assets.bag_icon} alt="" />
                                <p>Pesanan</p>
                            </li>
                            <hr />
                            <li onClick={() => { setIsProfileOpen(false); logout(); }}>
                                <img src={assets.logout_icon} alt="" />
                                <p>Logout</p>
                            </li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    </div>
  )
}

export default Navbar