import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
        <div className='footer-content'>
            <div className="footer-content-left">
                <img src={assets.logo} alt="logo" className="footer-logo" />
                <p>Tetap update dengan promo seru dan info terbaru dari kami. Jangan lupa follow media sosial Bujang biar nggak ketinggalan momen seru! See you di next hangout!</p>
                <div className="footer-social-icons">
                    <img src={assets.facebook_icon} alt="" />
                    <img src={assets.twitter_icon} alt="" />
                    <img src={assets.linkedin_icon} alt="" />
                </div>
            </div>
            <div className="footer-content-center">
                <h2>PERUSAHAAN</h2>
                <ul>
                    <li>Beranda</li>
                    <li>Tentang kami</li>
                    <li>Kebijakan privasi</li>
                </ul>
            </div>
            <div className="footer-content-right">
                <h2>HUBUNGI KAMI</h2>
                <ul>
                    <li>+1-212-456-7890</li>
                    <li>bujang@gmail.com</li>
                </ul>
            </div>
        </div>
        <hr />
        <p className='footer-copyright'>Copyright 2024 - All Right Reserved.</p>
    </div>
  )
}

export default Footer