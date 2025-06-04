# API Setup Guide

This guide explains how to configure the TMDb and OMDb API keys for the Movie Recommendation App.

## Required API Keys

You need to obtain API keys from two services:

### 1. TMDb (The Movie Database) Access Token (Recommended)

- Visit: https://developer.themoviedb.org/reference/intro/authentication
- Create a free account
- Go to your account settings → API section
- **Preferred**: Copy your "API Read Access Token" (starts with `eyJhbGci...`)
- Alternative: Use your "API Key" (shorter string)
- This provides comprehensive movie and TV show data

### 2. OMDb (Open Movie Database) API Key

- Visit: https://www.omdbapi.com/apikey.aspx
- Request a free API key (1,000 requests per day)
- This provides additional details like IMDb ratings

## Setup Instructions

1. **Create Environment File**

   ```bash
   cd MovieRecommendationApp
   touch .env
   ```

2. **Add Your API Keys**
   Edit the `.env` file and add your keys:

   ```
   # API Keys for Movie Data Services

   # TMDb Authentication (use ACCESS_TOKEN for better security)
   TMDB_ACCESS_TOKEN=your_actual_tmdb_access_token_here
   # TMDB_API_KEY=your_actual_tmdb_api_key_here  # Alternative if no access token

   # OMDb API Key
   OMDB_API_KEY=your_actual_omdb_api_key_here

   # API Base URLs (these can stay as-is)
   TMDB_BASE_URL=https://api.themoviedb.org/3
   OMDB_BASE_URL=https://www.omdbapi.com
   ```

3. **Restart Metro**
   After adding the API keys, restart the Metro bundler:
   ```bash
   npm start -- --reset-cache
   ```

## Authentication Methods

### TMDb Access Token (Recommended)

- More secure than API keys
- Uses Bearer token authentication in headers
- Longer expiration times
- Better rate limiting

### TMDb API Key (Fallback)

- Traditional authentication method
- Passed as query parameter
- Still supported for backwards compatibility

The app automatically detects which authentication method you're using and configures itself accordingly.

## File Structure

- `src/utils/apiConfig.ts` - Main API configuration
- `src/types/env.d.ts` - TypeScript declarations for environment variables
- `babel.config.js` - Configured to load environment variables
- `.env` - Your API keys (not committed to git)

## Security Notes

- The `.env` file is already added to `.gitignore` to prevent committing API keys
- Never commit actual API keys to version control
- Keep your API keys secure and don't share them publicly
- Access tokens are preferred over API keys for better security

## Testing Configuration

You can test if your API keys are properly configured by checking the configuration status in the app. The `isConfigured()` function in `apiConfig.ts` will validate your setup and show which authentication method is being used.

## Troubleshooting

1. **Module '@env' not found**: Restart Metro with cache reset
2. **API calls failing**: Check that your API keys are valid and have proper permissions
3. **Rate limiting**: TMDb allows 40 requests per 10 seconds, OMDb allows 1,000 per day
4. **Access token issues**: Ensure the token starts with `eyJhbGci` and is copied completely
5. **URL formatting issues**:
   - Correct URL format: `https://api.themoviedb.org/3/movie/popular?page=1`
   - Incorrect: `https://api.themoviedb.org/3/movie/popular/?page=1` (extra slash)
   - The app automatically handles proper URL construction and authentication headers
6. **Debug logging**: Check the console logs to see the actual URLs being called and authentication method being used

## Verification

After setting up your API keys, you can test the integration by:

1. **In-App Testing**: Go to Profile → Test API Calls to run comprehensive tests
2. **Console Logs**: Watch the console for URL and authentication debug information
3. **Manual Testing**: Use the individual test buttons to verify specific API endpoints

The test screen will show you:

- Configuration status for both APIs
- Whether access token or API key authentication is being used
- Actual API responses and any error messages
- URL construction for debugging purposes
