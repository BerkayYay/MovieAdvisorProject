# 🎬 Movie Advisor - React Native App

A modern, intuitive React Native app for discovering and managing personalized movie and TV show recommendations.

## 📱 Project Overview

This is a cross-platform mobile application built with React Native that allows users to:

- Discover trending movies and TV shows
- Search for content with live filtering
- Manage favorite movies and shows
- Get personalized recommendations
- View detailed information about content

## 🏗️ Development Phases

### Phase 1 - Frontend Development (Current)

- ✅ Project setup and configuration
- 🚧 UI screens with mock data
- 🚧 Local state management with AsyncStorage
- 🚧 Navigation and user interactions

### Phase 2 - Backend Integration (Future)

- Integration with real APIs (TMDb, OMDb)
- User authentication and profiles
- Cloud data synchronization
- Enhanced recommendation engine

## 🛠️ Tech Stack

- **Framework:** React Native 0.79.2
- **Navigation:** React Navigation v6
- **Storage:** AsyncStorage
- **Language:** TypeScript
- **State Management:** React Hooks + AsyncStorage
- **UI Components:** Custom components with themed styling

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
├── screens/          # Screen components
├── navigation/       # Navigation configuration
├── services/         # API and data services
├── utils/           # Utility functions and storage
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── assets/          # Images, fonts, etc.
└── data/            # Mock data files
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd MovieRecommendationApp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install iOS dependencies**

   ```bash
   cd ios && bundle exec pod install && cd ..
   ```

4. **Run the application**

   For iOS:

   ```bash
   npx react-native run-ios
   ```

   For Android:

   ```bash
   npx react-native run-android
   ```

## 📱 Features

### Implemented

- ✅ Project structure and navigation setup
- ✅ TypeScript interfaces and type safety
- ✅ AsyncStorage utilities for local data
- ✅ Basic theming and styling configuration

### In Development

- 🚧 Onboarding screen
- 🚧 Authentication UI
- 🚧 Home screen with categories
- 🚧 Search functionality
- 🚧 Favorites management
- 🚧 Details screen
- 🚧 Profile and settings

### Planned

- 📋 Mock data integration
- 📋 Enhanced UI components
- 📋 Performance optimizations
- 📋 Theme switching
- 📋 Backend API integration

## 🎨 Design System

The app uses a consistent design system with:

- **Dark theme** optimized for movie browsing
- **Blue accent colors** for interactive elements
- **Responsive design** for various screen sizes
- **Modern UI patterns** following platform guidelines

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Development Guidelines

1. **Code Style:** Follow ESLint and Prettier configurations
2. **Components:** Create reusable, well-documented components
3. **TypeScript:** Maintain strong typing throughout the codebase
4. **Storage:** Use provided AsyncStorage utilities for consistency
5. **Navigation:** Follow the established navigation patterns

## 🤝 Contributing

1. Create a feature branch from main
2. Make your changes following the coding guidelines
3. Test your changes thoroughly
4. Submit a pull request with a clear description

## 📄 License

This project is part of a learning exercise and development portfolio.

## 📞 Support

For questions or issues, please refer to the project documentation or create an issue in the repository.

---

**Last Updated:** June 2024  
**Version:** 1.0.0 (Phase 1)
