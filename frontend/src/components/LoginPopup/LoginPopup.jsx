import React, { useContext, useState } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import axios from "axios";

const LoginPopup = ({ setShowLogin }) => {
    const { url, setToken } = useContext(StoreContext);
    const [currState, setCurrState] = useState("Login");
    const [data, setData] = useState({
        name: "",
        email: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Password visibility state

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(prevData => ({ ...prevData, [name]: value }));
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prevState => !prevState);
    };

    const onLogin = async (event) => {
        event.preventDefault();
        let newUrl = `${url}/api/user`;
        newUrl += currState === "Login" ? "/login" : "/register";

        try {
            const response = await axios.post(newUrl, data);

            if (response.data.success) {
                setToken(response.data.token);
                localStorage.setItem("token", response.data.token);
                setShowLogin(false);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError("An error occurred. Please try again.");
            }
        }
    };

    return (
        <div className='login-popup'>
            <form onSubmit={onLogin} className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{currState}</h2>
                    <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" />
                </div>
                <div className="login-popup-inputs">
                    {currState === "Sign Up" && (
                        <input
                            name='name'
                            onChange={onChangeHandler}
                            value={data.name}
                            type="text"
                            placeholder='Nama kamu'
                            required
                            className={error && !data.name ? 'input-error' : ''}
                        />
                    )}
                    <input
                        name='email'
                        onChange={onChangeHandler}
                        value={data.email}
                        type="email"
                        placeholder='Email kamu'
                        required
                        className={error && !data.email ? 'input-error' : ''}
                    />
                    <div className="password-container">
                        <input
                            name='password'
                            onChange={onChangeHandler}
                            value={data.password}
                            type={isPasswordVisible ? "text" : "password"}
                            placeholder='Password'
                            required
                            className={error && !data.password ? 'input-error' : ''}
                        />
                        <span className="toggle-password" onClick={togglePasswordVisibility}>
                            <FontAwesomeIcon icon={isPasswordVisible ? faEyeSlash : faEye} />
                        </span>
                    </div>
                </div>
                {error && <div className="login-popup-error">{error}</div>}
                <button type='submit'>{currState === "Sign Up" ? "Buat akun" : "Masuk"}</button>
                <div className="login-popup-condition">
                    <input type="checkbox" required />
                    <p>Saya setuju dengan syarat & ketentuan serta kebijakan privasi</p>
                </div>
                {currState === "Login"
                    ? <p>Belum punya akun? <span onClick={() => setCurrState("Sign Up")}>Daftar di sini</span></p>
                    : <p>Sudah punya akun? <span onClick={() => setCurrState("Login")}>Masuk di sini</span></p>
                }
            </form>
        </div>
    );
}

export default LoginPopup;
