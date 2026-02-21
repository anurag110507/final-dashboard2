const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production_12345';
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log(`📝 Registration request: ${email} as ${role}`);

    // Validate input
    if (!name || !email || !password) {
      console.warn('⚠️ Missing required fields: name, email, or password');
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Validate role
    const validRole = ['user', 'owner'].includes(role) ? role : 'user';
    console.log(`👤 Role validated: ${validRole}`);

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.warn(`⚠️ Email already registered: ${email}`);
      return res.status(409).json({ message: 'Email already registered' });
    }
    console.log(`✅ Email is unique: ${email}`);

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: validRole
    });

    await user.save();
    console.log(`👨 User created successfully: ${user._id}`);

    const token = generateToken(user);
    console.log(`🔑 Token generated for new user: ${email}`);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        greenScore: user.greenScore,
        totalChargingTime: user.totalChargingTime
      }
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔓 Login request: ${email}`);

    // Validate input
    if (!email || !password) {
      console.warn('⚠️ Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`⚠️ User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log(`✅ User found: ${user.name} (${user.email}) - Role: ${user.role}`);

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.warn(`⚠️ Invalid password for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log(`✅ Password verified for: ${email}`);

    const token = generateToken(user);
    console.log(`🔑 Token generated for: ${email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        greenScore: user.greenScore,
        totalChargingTime: user.totalChargingTime
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Verify token endpoint
exports.verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        greenScore: user.greenScore,
        totalChargingTime: user.totalChargingTime
      }
    });
  } catch (err) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
};

