import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";
import { IoCallOutline, IoMailOutline } from "react-icons/io5";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer" id="footer">
      <div className="footer-inner">
        <div className="footer-main">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" onClick={handleScrollToTop} className="footer-logo-link">
              <img src={assets.logo} alt="Bujang" className="footer-logo" />
            </Link>
            <p className="footer-desc">
              Pesan menu favorit Anda langsung dari meja dengan cepat, praktis, dan tanpa antre.
            </p>
            <div className="footer-social-icons">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="social-icon-btn"
              >
                <img src={assets.facebook_icon} alt="Facebook" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="social-icon-btn"
              >
                <img src={assets.twitter_icon} alt="Twitter" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="social-icon-btn"
              >
                <img src={assets.linkedin_icon} alt="LinkedIn" />
              </a>
            </div>
          </div>

          {/* Links Columns Grid */}
          <div className="footer-links-grid">
            <div className="footer-column">
              <h4 className="footer-column-title">Perusahaan</h4>
              <ul className="footer-nav-list">
                <li>
                  <Link to="/" onClick={handleScrollToTop}>
                    Beranda
                  </Link>
                </li>
                <li>
                  <a href="#explore-menu">Menu</a>
                </li>
                <li>
                  <a href="#footer">Tentang Kami</a>
                </li>
                <li>
                  <a href="#footer">Kebijakan Privasi</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Hubungi Kami</h4>
              <ul className="footer-contact-list">
                <li>
                  <a href="tel:+12124567890" className="contact-link">
                    <IoCallOutline className="contact-icon" />
                    <span>+1-212-456-7890</span>
                  </a>
                </li>
                <li>
                  <a href="mailto:bujang@gmail.com" className="contact-link">
                    <IoMailOutline className="contact-icon" />
                    <span>bujang@gmail.com</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} Bujang. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;