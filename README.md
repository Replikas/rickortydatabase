# Rickorty Database 🛸

A comprehensive fanworks database for Rick and Morty content, featuring art galleries, fanfiction archives, and community interactions.

## 🌟 Features

### Content Management
- **Art Gallery**: Upload and browse fan art with thumbnail generation
- **Fanfiction Archive**: Upload and read fanfics with word count tracking
- **Advanced Search**: Filter by tags, ratings, warnings, authors, and more
- **Content Discovery**: Popular tags, similar content recommendations

### User Experience
- **User Profiles**: Customizable profiles with upload history
- **Social Features**: Follow users, like/bookmark content, comments
- **Dark/Light Theme**: Responsive design with theme switching
- **NSFW Controls**: Age-appropriate content filtering
- **Mobile Responsive**: Optimized for all device sizes

### Community Features
- **Comments System**: Nested comments with like/reply functionality
- **Content Rating**: Community-driven rating system
- **Moderation Tools**: Content flagging and admin controls
- **User Interactions**: Following, blocking, favorites

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rickandmortydatabase
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cd ../server
   cp .env.example .env
   
   # Edit .env with your configuration
   # Required: MONGODB_URI, JWT_SECRET
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: Start backend server
   cd server
   npm run dev
   
   # Terminal 2: Start frontend client
   cd client
   npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

## 🚀 Deployment

For production deployment, see the detailed [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

### Quick Deploy Checklist
1. Set up MongoDB Atlas database
2. Generate secure JWT_SECRET
3. Configure environment variables
4. Deploy to your preferred platform (Vercel, Heroku, Railway, etc.)

### Required Environment Variables
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rickorty-db
JWT_SECRET=your-super-secure-jwt-secret-key
CLIENT_URL=https://your-frontend-domain.com
NODE_ENV=production
```

## 📁 Project Structure

```
rickandmortydatabase/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main app component
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Express backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Express middleware
│   ├── uploads/          # File storage
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/rickorty-db

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key

# File Upload Limits
MAX_FILE_SIZE=52428800  # 50MB
MAX_FILES_PER_USER=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### MongoDB Setup

**Local MongoDB:**
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/your/db
```

**MongoDB Atlas (Cloud):**
1. Create account at https://cloud.mongodb.com
2. Create cluster and get connection string
3. Update `MONGODB_URI` in `.env`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/preferences` - Update preferences

### Content Endpoints
- `GET /api/content` - List content with filters
- `POST /api/content` - Upload new content
- `GET /api/content/:id` - Get single content
- `POST /api/content/:id/like` - Like/unlike content
- `POST /api/content/:id/bookmark` - Bookmark content
- `DELETE /api/content/:id` - Delete content

### Search Endpoints
- `GET /api/search` - Advanced search
- `GET /api/search/tags/popular` - Popular tags
- `GET /api/search/suggestions` - Search suggestions
- `GET /api/search/stats` - Content statistics
- `GET /api/search/:id/similar` - Similar content

### User Endpoints
- `GET /api/users/:username` - User profile
- `GET /api/users/:username/content` - User's content
- `POST /api/users/:username/follow` - Follow/unfollow user
- `GET /api/users/:username/followers` - User followers
- `GET /api/users/:username/following` - User following

### Comment Endpoints
- `GET /api/comments/content/:id` - Get content comments
- `POST /api/comments/content/:id` - Create comment
- `POST /api/comments/:id/like` - Like comment
- `PUT /api/comments/:id` - Edit comment
- `DELETE /api/comments/:id` - Delete comment

## 🎨 Frontend Architecture

### Key Technologies
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Axios**: HTTP client
- **React Hook Form**: Form management
- **React Hot Toast**: Notifications

### Component Structure
```
src/
├── components/
│   ├── Layout/           # Navigation, footer
│   ├── UI/              # Buttons, inputs, modals
│   ├── Content/         # Content cards, galleries
│   ├── User/            # Profile components
│   └── Forms/           # Upload, auth forms
├── pages/               # Route components
├── hooks/               # Custom hooks
└── utils/               # Helper functions
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configured origins
- **Helmet Security**: HTTP security headers
- **Input Validation**: Server-side validation
- **File Type Checking**: Secure file uploads
- **NSFW Filtering**: Age-appropriate content

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
NODE_ENV=production npm start
```

### Environment Setup

1. **Set production environment variables**
2. **Configure MongoDB Atlas or production database**
3. **Set up file storage (local or AWS S3)**
4. **Configure reverse proxy (nginx)**
5. **Set up SSL certificates**

### Docker Deployment (Optional)

```dockerfile
# Example Dockerfile for server
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test

# Run with coverage
npm run test:coverage
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Ensure responsive design

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Rick and Morty creators Dan Harmon and Justin Roiland
- The amazing Rick and Morty fan community
- Open source libraries and contributors

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: Wiki pages

---

**Wubba lubba dub dub!** 🛸✨

Built with ❤️ for the Rick and Morty fan community