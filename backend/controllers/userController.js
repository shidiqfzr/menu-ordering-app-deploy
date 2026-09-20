import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// Function to create a JWT token with expiration
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '12d' }); // Token expires in 7 days
};

// Register user
const registerUser = async (req, res) => {
    const { name, password } = req.body;
    const email = req.body.email.toLowerCase(); // Normalize email input

    try {
        // Checking if the user already exists
        const exist = await userModel.findOne({ email });
        if (exist) {
            return res.status(400).json({ success: false, message: "Pengguna sudah terdaftar. Silakan gunakan email lain." });
        }

        // Validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Masukkan email yang valid." });
        }

        // if (!validator.isStrongPassword(password)) {
        //     return res.status(400).json({ success: false, message: "Kata sandi harus minimal 8 karakter dan mencakup huruf besar, huruf kecil, angka, dan karakter khusus." });
        // }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Kata sandi harus minimal 8 karakter" });
        }

        // Hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creating a new user
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();

        // Creating a JWT token
        const token = createToken(user._id);

        res.status(201).json({ success: true, token, message: "Pendaftaran berhasil! Anda telah masuk." });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.log(error);
        }
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat mendaftar. Silakan coba lagi." });
    }
};

// Login user
const loginUser = async (req, res) => {
    const email = req.body.email.toLowerCase(); // Normalize email input
    const { password } = req.body;

    try {
        // Checking if the user exists
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Email atau kata sandi salah. Silakan coba lagi." });
        }

        // Comparing the password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: "Email atau kata sandi salah. Silakan coba lagi." });
        }

        // Creating a JWT token
        const token = createToken(user._id);

        res.status(200).json({ success: true, token, message: "Berhasil masuk! Selamat datang kembali." });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.log(error);
        }
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat masuk. Silakan coba lagi." });
    }
};

// Admin Login
const adminLogin = async (req, res) => {
    const email = (req.body.email || '').toLowerCase().trim();
    const { password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email dan kata sandi wajib diisi." });
    }

    const defaultManagerEmail = (process.env.MANAGER_EMAIL || "manager@bujangcafe.com").toLowerCase().trim();
    const defaultManagerPassword = process.env.MANAGER_PASSWORD || "manager12345";
    const legacyAdminEmail = (process.env.ADMIN_EMAIL || "admin@bujangcafe.com").toLowerCase().trim();
    const legacyAdminPassword = process.env.ADMIN_PASSWORD || "admin12345";
    const defaultKasirEmail = (process.env.KASIR_EMAIL || "kasir@bujangcafe.com").toLowerCase().trim();
    const defaultKasirPassword = process.env.KASIR_PASSWORD || "kasir12345";
    const allowedStaffRoles = ['admin', 'manager', 'kasir', 'kitchen'];

    try {
        let user = await userModel.findOne({ email });

        // Helper to sign token and return response
        const sendAuthResponse = (userData, role, message) => {
            const token = jwt.sign({ id: userData._id, role }, process.env.JWT_SECRET, { expiresIn: '12d' });
            return res.status(200).json({
                success: true,
                token,
                user: {
                    id: userData._id,
                    name: userData.name,
                    email: userData.email,
                    role
                },
                message
            });
        };

        const isManagerDefault = (email === defaultManagerEmail && password === defaultManagerPassword) ||
                                 (email === legacyAdminEmail && password === legacyAdminPassword);
        const isKasirDefault = (email === defaultKasirEmail && password === defaultKasirPassword);

        // Case 1: If user exists in DB
        if (user) {
            let isPasswordMatch = false;
            if (user.password) {
                isPasswordMatch = await bcrypt.compare(password, user.password);
            }

            if (!isPasswordMatch && !isManagerDefault && !isKasirDefault) {
                return res.status(400).json({ success: false, message: "Email atau kata sandi salah. Silakan coba lagi." });
            }

            // Sync role and password for default accounts if necessary
            if (isManagerDefault) {
                if (user.role !== 'manager') user.role = 'manager';
                if (user.name === 'Manager / Owner' || !user.name) user.name = 'Manager';
                if (!isPasswordMatch) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(password, salt);
                }
                await user.save();
            } else if (isKasirDefault) {
                if (user.role !== 'kasir') user.role = 'kasir';
                if (user.name === 'Kasir / Kitchen' || !user.name) user.name = 'Kasir';
                if (!isPasswordMatch) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(password, salt);
                }
                await user.save();
            }

            // Verify role has panel authorization
            const userRole = (user.role === 'admin') ? 'manager' : user.role;
            if (!allowedStaffRoles.includes(user.role)) {
                return res.status(403).json({ success: false, message: "Akses ditolak. Akun ini tidak memiliki hak akses Administrator atau Kasir." });
            }

            const welcomeRole = userRole === 'kasir' ? 'Kasir' : 'Manager';
            return sendAuthResponse(user, userRole, `Berhasil masuk sebagai ${welcomeRole}! Selamat bekerja.`);
        }

        // Case 2: Auto-provision Default Manager if not exists in DB
        if (isManagerDefault) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newManager = new userModel({
                name: "Manager",
                email: email,
                password: hashedPassword,
                role: "manager"
            });

            const saved = await newManager.save();
            return sendAuthResponse(saved, 'manager', "Berhasil masuk! Akun Manager telah dibuat.");
        }

        // Case 3: Auto-provision Default Kasir if not exists in DB
        if (isKasirDefault) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(defaultKasirPassword, salt);

            const newKasir = new userModel({
                name: "Kasir",
                email: defaultKasirEmail,
                password: hashedPassword,
                role: "kasir"
            });

            const saved = await newKasir.save();
            return sendAuthResponse(saved, 'kasir', "Berhasil masuk! Akun Kasir telah dibuat.");
        }

        return res.status(400).json({ success: false, message: "Email atau kata sandi salah. Silakan coba lagi." });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server saat login admin." });
    }
};

// Verify Admin Token
const verifyAdmin = async (req, res) => {
    const authHeader = req.headers.authorization || req.headers.token;
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "Token otentikasi tidak ditemukan." });
    }

    try {
        const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await userModel.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
        }

        const role = (user.role === 'admin') ? 'manager' : (user.role || decoded.role || 'manager');

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: "Token tidak valid atau telah kadaluarsa." });
    }
};

export { loginUser, registerUser, adminLogin, verifyAdmin };