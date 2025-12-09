# ISS Mobile App

A React Native app built with Expo for both Android and iOS platforms. This app features a modern sign-up screen with form validation, password strength indicators, and multi-language support.

## Features

- **Modern UI Design**: Clean and intuitive interface matching the provided design
- **Form Validation**: Real-time validation for phone number, email, and password fields
- **Password Strength Indicator**: Visual feedback for password strength
- **Multi-language Support**: Armenian, English, and Russian language options
- **Responsive Design**: Optimized for both Android and iOS devices
- **Keyboard Handling**: Proper keyboard avoidance and input focus management
- **Error Handling**: User-friendly error messages and validation feedback
- **QR Code Generation**: Generate QR codes for access control (Smart Intercom, Elevator, Barrier)
- **PIN Code Access**: Get access codes for secure entry
- **Family Members**: Invite and manage family members
- **Profile Management**: User profile with support and contact options

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── CustomInput.js
│   ├── CustomButton.js
│   ├── PasswordStrengthIndicator.js
│   └── LanguageSelector.js
├── screens/            # Screen components
│   ├── SignUpScreen.js
│   ├── SignInScreen.js
│   ├── HomeScreen.js
│   ├── GenerateQRCodeScreen.js
│   ├── PinAccessScreen.js
│   └── ...
├── constants/          # App constants
│   ├── colors.js
│   └── enums.js
├── services/           # API services
│   ├── api.js
│   └── qrApi.js
├── store/              # Redux store
│   └── slices/
└── utils/              # Utility functions
    └── validation.js
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Navigate to the project directory:
   ```bash
   cd ISS_mobile_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Running the App

- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

## API Configuration

The app uses environment variables for API configuration. Update `src/config/env.js` with your API base URL:

```javascript
BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://your-api-url.com'
```

## Components

### CustomInput
A reusable input component with:
- Focus states and animations
- Error handling and validation
- Password visibility toggle
- Clear button functionality

### CustomButton
A customizable button component with:
- Loading states
- Disabled states
- Primary and secondary variants

### PasswordStrengthIndicator
Visual password strength feedback with:
- Color-coded strength bars
- Text-based strength indicators
- Real-time updates

### LanguageSelector
Multi-language support with:
- Three language options (Armenian, English, Russian)
- Visual selection feedback
- Callback for language changes

## Form Validation

The app includes comprehensive form validation:

- **Phone Number**: Format validation and Armenian country code support
- **Email**: Standard email format validation
- **Password**: Minimum length and strength requirements

## Styling

The app uses a consistent design system with:
- Purple primary color scheme (#3C0056)
- Gray scale for secondary elements
- Proper spacing and typography
- Responsive design principles

## Development

### Adding New Features

1. Create new components in `src/components/`
2. Add new screens in `src/screens/`
3. Update constants in `src/constants/`
4. Add utility functions in `src/utils/`

### Code Style

- Use functional components with hooks
- Follow React Native best practices
- Maintain consistent naming conventions
- Add proper error handling

## Testing

The app has been tested on:
- iOS Simulator
- Android Emulator
- Physical devices (both platforms)

## License

This project is private and proprietary.
