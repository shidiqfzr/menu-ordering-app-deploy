import React, { useContext, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import Swal from 'sweetalert2';

const Navbar = ({setShowLogin}) => {

    const [menu, setMenu] = useState("home");

    const {getTotalCartAmount, token, setToken} = useContext(StoreContext)

    const navigate = useNavigate();

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
        <Link to='/'><img src={assets.logo} alt="" className="logo" /></Link>
        <ul className="navbar-menu">
            <Link to='/' onClick={()=>setMenu("home")} className={menu==="home"?"active":""}>promo</Link>
            <a href='#explore-menu' onClick={()=>setMenu("menu")} className={menu==="menu"?"active":""}>menu</a>
            <a href='#footer' onClick={()=>setMenu("contact-us")} className={menu==="contact-us"?"active":""}>kontak</a>
        </ul>
        <div className="navbar-right">
            {/* <img src={assets.search_icon} alt="" /> */}
            <div className="navbar-search-icon">
                <Link to='/cart'><img src={assets.basket_icon} alt="" /></Link>
                <div className={getTotalCartAmount()===0?"":"dot"}></div>
            </div>
            {!token?<button onClick={()=>setShowLogin(true)}>sign in</button>
            :<div className='navbar-profile'>
                <img src={assets.profile_icon} alt="" />
                <ul className="nav-profile-dropdown">
                    <li onClick={() => navigate('/myorders')}><img src={assets.bag_icon} alt="" /><p>Pesanan</p></li>
                    <hr />
                    <li onClick={logout}><img src={assets.logout_icon} alt="" /><p>Logout</p></li>
                </ul>
            </div>}
        </div>
    </div>
  )
}

export default Navbar