require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketio = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: '*' }
});

// ==================== MIDDLEWARE ====================

app.use(cors());
app.use(express.json());

// ==================== DATABASE ====================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/ifood-rp';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB conectado');
}).catch(err => {
  console.error('❌ Erro ao conectar MongoDB:', err);
});

// ==================== MODELS ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  addresses: [String],
  createdAt: { type: Date, default: Date.now }
});

// Restaurant Schema
const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  description: String,
  image: String,
  rating: { type: Number, default: 4.5 },
  active: { type: Boolean, default: true },
  owner: mongoose.Schema.Types.ObjectId,
  menu: [{
    name: String,
    price: Number,
    description: String
  }],
  createdAt: { type: Date, default: Date.now }
});

// Order Schema
const orderSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  restaurant: mongoose.Schema.Types.ObjectId,
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'], default: 'pending' },
  deliveryAddress: String,
  createdAt: { type: Date, default: Date.now },
  estimatedDelivery: Date
});

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: mongoose.Schema.Types.ObjectId,
  receiver: mongoose.Schema.Types.ObjectId,
  text: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Restaurant = mongoose.model('Restaurant', restaurantSchema);
const Order = mongoose.model('Order', orderSchema);
const Message = mongoose.model('Message', messageSchema);

// ==================== AUTH ROUTES ====================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui';

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword
    });
    
    await user.save();
    
    // Gerar token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Senha incorreta' });
    }
    
    // Gerar token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RESTAURANT ROUTES ====================

// Get all restaurants
app.get('/api/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single restaurant
app.get('/api/restaurants/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante não encontrado' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create restaurant (admin)
app.post('/api/restaurants', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Não autorizado' });
    }
    
    const restaurant = new Restaurant({
      ...req.body,
      owner: req.userId
    });
    
    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ORDER ROUTES ====================

// Get user orders
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).populate('restaurant');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      user: req.userId,
      estimatedDelivery: new Date(Date.now() + 30 * 60000) // 30 minutos
    });
    
    await order.save();
    
    // Emit socket event
    io.emit('new-order', order);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (admin)
app.put('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Não autorizado' });
    }
    
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Emit socket event
    io.emit('order-updated', order);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER ROUTES ====================

// Get profile
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
app.put('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all users (admin)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Não autorizado' });
    }
    
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (admin)
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Não autorizado' });
    }
    
    const orders = await Order.find().populate('user').populate('restaurant');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== MESSAGES / CHAT ====================

app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId }
      ]
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log('👤 Usuário conectado:', socket.id);
  
  // Chat message
  socket.on('chat-message', async (data) => {
    try {
      const message = new Message({
        sender: data.sender,
        receiver: data.receiver,
        text: data.text
      });
      
      await message.save();
      io.emit('chat-message-received', message);
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  });
  
  // Order update
  socket.on('order-status-change', async (data) => {
    io.emit('order-status-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('👤 Usuário desconectado:', socket.id);
  });
});

// ==================== SEED DATA ====================

async function seedData() {
  const userCount = await User.countDocuments();
  
  if (userCount === 0) {
    console.log('🌱 Criando dados iniciais...');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@ifood.com',
      phone: '11999999999',
      password: hashedPassword,
      isAdmin: true
    });
    await adminUser.save();
    console.log('✅ Usuário admin criado');
    
    // Create sample restaurants
    const restaurants = [
      { name: 'Burger King', category: 'Fast Food', description: 'Hambúrgueres deliciosos', active: true },
      { name: 'Pizza Hut', category: 'Pizzaria', description: 'Pizzas frescas todos os dias', active: true },
      { name: 'KFC', category: 'Frango', description: 'Frango crocante e saboroso', active: true }
    ];
    
    await Restaurant.insertMany(restaurants);
    console.log('✅ Restaurantes criados');
  }
}

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  await seedData();
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 Socket.io ativo em ws://localhost:${PORT}`);
});

module.exports = app;
