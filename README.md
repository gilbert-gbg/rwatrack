# RWATRACK - AI-Driven Government Employee Residence Tracking System

A comprehensive employee tracking solution with web dashboard and mobile app for government workers.

## 🚀 Features

- **Web Dashboard**: Complete admin and HR management interface
- **Mobile App**: Location tracking for field workers
- **AI Integration**: Machine learning models for fraud detection
- **Real-time Monitoring**: Live location updates and analytics
- **Offline Support**: Works without internet connection
- **Secure Authentication**: JWT-based authentication with role management

## 🏗️ Architecture

### Tech Stack
- **Backend**: Next.js 14 with TypeScript
- **Database**: MongoDB with Prisma ORM
- **Mobile**: Flutter (Dart)
- **AI/ML**: Python with scikit-learn, TensorFlow
- **Authentication**: JWT tokens with secure storage

### Components
- **Web App** (`/web`): Admin dashboard, HR tools, analytics
- **Mobile App** (`/rwatrack_mobile`): Worker location tracking
- **AI Engine** (`/ai_api.py`): Fraud detection and analytics
- **ML Models** (`/trained_models`): Pre-trained fraud detection models

## 📱 Mobile-Web Integration

The system supports seamless integration between web registration and mobile usage:

1. **Worker Registration**: Workers register on the web platform
2. **Account Approval**: HR/Admin approves accounts
3. **Mobile Login**: Workers sign in on mobile with same credentials
4. **Location Tracking**: Automatic GPS tracking with offline support

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Authentication (supports mobile JWT)
- `POST /api/location-logs` - Location data submission
- `GET /api/location-logs` - Location history (admin/HR only)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Flutter 3.0+
- Python 3.8+
- MongoDB
- Android Studio / Xcode (for mobile development)

### 1. Database Setup
```bash
# Install MongoDB and create database
# Update DATABASE_URL in web/.env.local
DATABASE_URL="mongodb://localhost:27017/rwatrack"
```

### 2. Web App Setup
```bash
cd web
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Mobile App Setup
```bash
cd rwatrack_mobile
flutter pub get
# Update IP address in lib/services/api_service.dart
# Change baseUrl to your computer's IP: 'http://YOUR_IP:3000'
flutter run
```

### 4. AI/ML Setup (Optional)
```bash
pip install -r requirements.txt
python ai_api.py
```

## 🔧 Configuration

### Mobile App Configuration
The mobile app includes a settings screen to configure the API endpoint:

1. Open the app
2. Tap the settings icon (⚙️) in the top-right
3. Enter your computer's IP address
4. Test the connection
5. Restart the app

### Environment Variables
Create `web/.env.local`:
```env
DATABASE_URL="mongodb://localhost:27017/rwatrack"
JWT_SECRET="your-super-secret-jwt-key"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## 📊 User Roles & Permissions

- **ADMIN**: Full system access, user management
- **HR**: Worker management, location monitoring
- **WORKER**: Mobile app access, location tracking

## 🔐 Security Features

- JWT authentication with secure storage
- Role-based access control
- Location data encryption
- Audit logging for all actions
- Fraud detection algorithms

## 📱 Mobile App Features

- **Location Tracking**: Automatic GPS updates
- **Offline Mode**: Caches data when offline
- **Network Monitoring**: Real-time connectivity status
- **Settings**: Configurable API endpoints
- **Secure Storage**: Encrypted token storage

## 🌐 Web Dashboard Features

- **User Management**: Register, approve, suspend users
- **Location Analytics**: Real-time tracking and history
- **Fraud Detection**: AI-powered anomaly detection
- **Audit Logs**: Complete activity tracking
- **Reports**: Exportable location and user reports

## 🚀 Deployment

### Production Setup
1. Set up MongoDB database
2. Configure environment variables
3. Build and deploy web app
4. Update mobile app API URL
5. Build and publish mobile app

### Mobile App Build
```bash
flutter build apk --release  # Android
flutter build ios --release  # iOS
```

## 🧪 Testing

### Web App Tests
```bash
cd web
npm run test
```

### Mobile App Tests
```bash
cd rwatrack_mobile
flutter test
```

## 📝 API Documentation

### Authentication
```typescript
// Login (supports mobile apps)
POST /api/auth/login
{
  "email": "worker@example.com",
  "password": "password",
  "role": "WORKER"  // optional
}

// Register
POST /api/auth/register
{
  "email": "worker@example.com",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe",
  "role": "WORKER"
}
```

### Location Tracking
```typescript
// Submit location
POST /api/location-logs
Authorization: Bearer <jwt_token>
{
  "lat": -1.9441,
  "lng": 30.0619,
  "accuracy": 10.0
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is proprietary software for government use.

## 🆘 Support

For technical support, please contact the development team.

---

**Built with ❤️ for efficient government employee tracking**</content>
<parameter name="filePath">c:\Users\user2\kkkkkk\rwa-track-main\README.md