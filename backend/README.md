# iFood RP Backend

Backend API para a plataforma iFood RP

## 🛠️ Stack

- Node.js + Express
- MongoDB Atlas
- JWT Authentication
- Socket.io para real-time
- Bcryptjs para hash de senhas

## 📦 Instalação

```bash
npm install
```

## 🚀 Rodar localmente

```bash
npm run dev
```

Servidor estará em `http://localhost:5000`

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env`:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ifood-rp
JWT_SECRET=seu-secret-super-seguro-aqui
PORT=5000
NODE_ENV=development
```

## 📚 Endpoints

### Auth
- `POST /api/auth/signup` - Criar conta
- `POST /api/auth/login` - Login

### Restaurants
- `GET /api/restaurants` - Listar restaurantes
- `GET /api/restaurants/:id` - Detalhes restaurante
- `POST /api/restaurants` - Criar restaurante (admin)

### Orders
- `GET /api/orders` - Meus pedidos
- `POST /api/orders` - Criar pedido
- `PUT /api/orders/:id` - Atualizar status (admin)

### User
- `GET /api/user/profile` - Perfil
- `PUT /api/user/profile` - Atualizar perfil

### Admin
- `GET /api/admin/users` - Listar usuários (admin)
- `GET /api/admin/orders` - Listar pedidos (admin)

### Chat
- `GET /api/messages/:userId` - Mensagens com usuário

## 🔄 Socket.io Events

- `chat-message` - Enviar mensagem
- `chat-message-received` - Mensagem recebida
- `order-status-change` - Mudança no status do pedido
- `order-status-updated` - Status atualizado

## 📱 Deploy

Recomendado: **Render** (free tier)

1. Cria uma conta em https://render.com
2. Conecta seu repositório GitHub
3. Cria um novo Web Service
4. Define as variáveis de ambiente
5. Deploy automático! 🚀

## 📝 Licença

MIT
