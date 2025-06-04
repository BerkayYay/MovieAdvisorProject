# 🎬 Movie Advisor Project

A comprehensive movie and TV show recommendation application built with React Native and Node.js/NestJS backend. Get personalized recommendations, discover new content, and manage your favorites with real-time data from TMDb and OMDb APIs.

## 🌟 Features

### Mobile App (React Native)

- **Personalized Recommendations**: Genre-based content filtering and personalized suggestions
- **Real-time Movie Data**: Integration with TMDb and OMDb APIs for up-to-date content
- **User Authentication**: Secure registration, login, and profile management
- **Advanced Search**: Search movies and TV shows with genre filtering
- **Favorites Management**: Save and organize your favorite content
- **Detailed Movie/TV Info**: Comprehensive details including ratings, cast, and plot
- **Profile Customization**: Edit profile information and change passwords
- **Modern UI/UX**: Smooth animations, lazy loading, and intuitive navigation

### Backend API (Node.js/NestJS)

- **RESTful API**: Clean, scalable API architecture with NestJS
- **JWT Authentication**: Secure token-based authentication system
- **PostgreSQL Database**: Robust data persistence with TypeORM
- **Password Security**: Bcrypt hashing for secure password storage
- **User Management**: Complete user profile and authentication endpoints
- **Input Validation**: Comprehensive request validation and error handling

## 🛠 Tech Stack

### Frontend

- **React Native** 0.79.2
- **TypeScript** 5.0.4
- **React Navigation** 7.x (Stack & Bottom Tabs)
- **AsyncStorage** for local data persistence
- **React Native Vector Icons** for UI elements

### Backend

- **Node.js** with **NestJS** 11.x
- **TypeScript** 5.7.3
- **PostgreSQL** with **TypeORM** 0.3.24
- **JWT** authentication with **Passport**
- **bcryptjs** for password hashing
- **Class Validator** for request validation

### External APIs

- **TMDb API** - The Movie Database for movie/TV data
- **OMDb API** - Open Movie Database for additional movie details

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **React Native CLI**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development)
- **PostgreSQL** database

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/MovieAdvisorProject.git
cd MovieAdvisorProject
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend/movie-advisor-api

# Install dependencies
npm install

# Set up PostgreSQL database
# Create a database named 'movie_advisor' or configure your preferred name

# Configure environment variables (create .env file)
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migration:run

# Start the development server
npm run start:dev
```

The backend API will be available at `http://localhost:3000`

### 3. Mobile App Setup

```bash
# Navigate to React Native app directory
cd MovieRecommendationApp

# Install dependencies
npm install

# Configure backend connection (optional - see Backend Configuration section)
# Copy and customize .env.example if needed: cp .env.example .env

# Set up API keys (see API Configuration section)

# For iOS (macOS only)
cd ios && pod install && cd ..

# Start Metro bundler
npm start

# Run on Android (in a new terminal)
npm run android

# Run on iOS (in a new terminal, macOS only)
npm run ios
```

## 🔧 Backend Configuration

The mobile app automatically detects the platform and uses appropriate backend URLs:

- **iOS Simulator**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`

### Custom Configuration Options

Create a `.env` file in `MovieRecommendationApp/` for custom configuration:

#### Option 1: Custom Port (Recommended for Testing)

```env
# If your backend runs on a different port
BACKEND_PORT=4000
```

Result:

- iOS: `http://localhost:4000`
- Android: `http://10.0.2.4000`

#### Option 2: Custom Host (For Real Device Testing)

```env
# Use your computer's IP address for testing on real devices
BACKEND_HOST=192.168.1.100
```

Result: `http://192.168.1.100:3000` (both platforms)

#### Option 3: Full Custom URL (Production/Deployment)

```env
# Complete custom backend URL (highest priority)
BACKEND_API_URL=https://api.movieadvisor.com
```

#### Common Scenarios:

- **Different Port**: Set `BACKEND_PORT=4000`
- **Real Android Device**: Set `BACKEND_HOST=YOUR_COMPUTER_IP`
- **Real iOS Device**: Set `BACKEND_HOST=YOUR_COMPUTER_IP`
- **Production**: Set `BACKEND_API_URL=https://your-api.com`

### Getting Your Computer's IP:

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

## 🔑 API Configuration

You need API keys from TMDb and OMDb to fetch real movie data. See [API_SETUP.md](./API_SETUP.md) for detailed instructions.

### Quick Setup:

1. **Get TMDb Access Token**: Visit [TMDb API](https://developer.themoviedb.org/reference/intro/authentication)
2. **Get OMDb API Key**: Visit [OMDb API](https://www.omdbapi.com/apikey.aspx)
3. **Create .env file** in `MovieRecommendationApp/`:

```env
# TMDb Authentication (preferred)
TMDB_ACCESS_TOKEN=your_tmdb_access_token_here

# OMDb API Key
OMDB_API_KEY=your_omdb_api_key_here

# API Base URLs
TMDB_BASE_URL=https://api.themoviedb.org/3
OMDB_BASE_URL=https://www.omdbapi.com
```

4. **Restart Metro** with cache reset:

```bash
npm start -- --reset-cache
```

## 🏗 Project Structure

```
MovieAdvisorProject/
│
├── MovieRecommendationApp/          # React Native Mobile App
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── screens/                 # App screens
│   │   ├── navigation/              # Navigation configuration
│   │   ├── services/                # API services
│   │   ├── utils/                   # Utility functions
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── context/                 # React Context providers
│   │   ├── data/                    # Mock data and constants
│   │   └── assets/                  # Images and static assets
│   ├── android/                     # Android-specific files
│   ├── ios/                         # iOS-specific files
│   └── .env                         # API keys (create this)
│
├── backend/
│   └── movie-advisor-api/           # NestJS Backend API
│       ├── src/
│       │   ├── auth/                # Authentication module
│       │   ├── users/               # User management module
│       │   ├── profile/             # Profile management module
│       │   └── main.ts              # Application entry point
│       └── .env                     # Database config (create this)
│
├── API_SETUP.md                     # Detailed API setup guide
└── README.md                        # This file
```

## 📱 App Features Breakdown

### Authentication System

- User registration with email validation
- Secure login with JWT tokens
- Password hashing with bcrypt
- Profile management and editing
- Password change functionality

### Movie Discovery

- Browse popular movies and TV shows
- Search functionality with real-time results
- Genre-based filtering and preferences
- Detailed movie/TV information pages
- High-quality poster images and trailers

### Personalization

- User-specific genre preferences
- Personalized recommendation algorithm
- Favorites management with local storage
- Custom viewing history tracking

### User Interface

- Modern, intuitive design
- Smooth animations and transitions
- Loading states and error handling
- Responsive layouts for different screen sizes
- Dark/light theme support (coming soon)

## 🧪 Testing

### Backend Testing

```bash
cd backend/movie-advisor-api

# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

### Mobile App Testing

```bash
cd MovieRecommendationApp

# Run tests
npm test

# Test API integration
# Use the in-app "Test API Calls" feature in Profile screen
```

## 🔧 Development Commands

### Backend (NestJS)

```bash
npm run start:dev          # Development with hot reload
npm run start:debug        # Debug mode
npm run build              # Production build
npm run start:prod         # Production mode
npm run lint               # ESLint
npm run format             # Prettier formatting
```

### Mobile App (React Native)

```bash
npm start                  # Start Metro bundler
npm run android           # Run on Android
npm run ios               # Run on iOS
npm run lint              # ESLint
npx react-native log-android  # View Android logs
npx react-native log-ios      # View iOS logs
```

## 🔧 Troubleshooting

### Android Emulator Network Issues

If you're getting "Network request failed" errors on Android emulator while iOS simulator works fine:

1. **Backend Configuration**: Make sure your backend is listening on all interfaces:

   ```bash
   cd backend/movie-advisor-api
   npm run start:dev
   ```

   You should see:

   ```
   🚀 Movie Advisor API is running on:
      - Local: http://localhost:3000
      - Android Emulator: http://10.0.2.2:3000
      - Network: http://0.0.0.0:3000
   ```

2. **App Configuration**: The app automatically uses the correct URL for each platform:

   - iOS Simulator: `http://localhost:3000`
   - Android Emulator: `http://10.0.2.2:3000`

3. **Custom Backend URL**: If you need to use a custom backend URL, create a `.env` file in `MovieRecommendationApp/`:

   ```env
   BACKEND_API_URL=http://your-custom-backend-url:3000
   ```

4. **Clear Metro Cache**: After making network configuration changes:

   ```bash
   cd MovieRecommendationApp
   npm start -- --reset-cache
   ```

5. **Check Backend Logs**: Monitor backend console for incoming requests to verify connectivity.

### Common Solutions

- **Restart Backend**: Stop and restart the backend server after configuration changes
- **Restart Emulator**: Close and reopen the Android emulator
- **Check Firewall**: Ensure your firewall allows connections on port 3000
- **Use Real Device**: For persistent issues, test on a real Android device with your computer's IP address

## 🚀 Deployment

### Backend Deployment

1. Set up PostgreSQL database on your server
2. Configure environment variables for production
3. Build the application: `npm run build`
4. Deploy using PM2, Docker, or your preferred method

### Mobile App Deployment

1. **Android**: Generate signed APK or AAB for Google Play Store
2. **iOS**: Archive and upload to App Store Connect

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

If you encounter any issues or have questions:

1. Check the [API_SETUP.md](./API_SETUP.md) for API configuration issues
2. Review the troubleshooting section in the setup guide
3. Create an issue on GitHub with detailed error information

---

**Built with ❤️ using React Native and NestJS**
