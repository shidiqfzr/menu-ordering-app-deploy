import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 2000); // Hide toast after 2 seconds

        return () => clearTimeout(timer); // Cleanup on unmount
    }, [onClose]);

    return (
        <div className="toast">
            <p>{message}</p>
        </div>
    );
};

export default Toast;