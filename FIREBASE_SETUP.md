# Firebase Setup Guide for Healify

This guide will walk you through setting up Firebase Cloud Messaging (FCM) for push notifications in the Healify app.

---

## Part 1: Firebase Console Setup

### Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click **"Add project"** or **"Create a project"**
   - Enter project name: `Healify` (or your preferred name)
   - Click **"Continue"**

3. **Google Analytics (Optional)**
   - Choose whether to enable Google Analytics
   - For development, you can disable it
   - Click **"Create project"**
   - Wait for project creation (takes ~30 seconds)
   - Click **"Continue"** when done

---

### Step 2: Add iOS App to Firebase

1. **Navigate to Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select **"Project settings"**

2. **Add iOS App**
   - Scroll down to "Your apps" section
   - Click the **iOS icon** (Apple logo)

3. **Register iOS App**
   - **iOS bundle ID:** `com.anonymous.HealthCareApp`
     - (This matches the `bundleIdentifier` in your `app.json`)
   - **App nickname (optional):** `Healify iOS`
   - **App Store ID (optional):** Leave blank for now
   - Click **"Register app"**

4. **Download Configuration File**
   - Click **"Download GoogleService-Info.plist"**
   - **IMPORTANT:** Save this file, you'll need it shortly
   - Click **"Next"**

5. **Skip SDK Setup**
   - Click **"Next"** (we'll handle this differently for React Native)
   - Click **"Continue to console"**

---

### Step 3: Add Android App to Firebase

1. **Add Android App**
   - In Project Settings, scroll to "Your apps"
   - Click the **Android icon** (robot)

2. **Register Android App**
   - **Android package name:** `com.anonymous.HealthCareApp`
     - (This matches the `package` in your `app.json`)
   - **App nickname (optional):** `Healify Android`
   - **Debug signing certificate SHA-1 (optional):** Leave blank for now
   - Click **"Register app"**

3. **Download Configuration File**
   - Click **"Download google-services.json"**
   - **IMPORTANT:** Save this file
   - Click **"Next"**

4. **Skip SDK Setup**
   - Click **"Next"** (we'll handle this for React Native)
   - Click **"Continue to console"**

---

### Step 4: Enable Cloud Messaging

1. **Navigate to Cloud Messaging**
   - In the left sidebar, click **"Build"** → **"Cloud Messaging"**
   - Or go to: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/notification`

2. **Enable Cloud Messaging API**
   - If you see a banner saying "Cloud Messaging API is disabled"
   - Click **"Enable"** or **"Get started"**
   - The API should now be enabled

3. **Note Your Server Key (for backend)**
   - Click on the **"Cloud Messaging"** tab
   - You'll see **"Server key"** - this is for the backend (we'll use Service Account instead)

---

### Step 5: Generate Service Account Key (for Backend)

1. **Go to Service Accounts**
   - In Firebase Console, click the gear icon ⚙️ → **"Project settings"**
   - Click the **"Service accounts"** tab

2. **Generate New Private Key**
   - Click **"Generate new private key"**
   - A dialog will appear warning you to keep it secure
   - Click **"Generate key"**
   - A JSON file will download automatically
   - **Rename this file to:** `serviceAccountKey.json`

3. **Keep This File Secure**
   - ⚠️ **NEVER commit this file to Git**
   - ⚠️ **NEVER share this file publicly**
   - This file contains credentials to send notifications

---

## Part 2: Mobile App Configuration

### Step 6: Place Configuration Files

1. **For iOS - GoogleService-Info.plist**
   ```bash
   # Navigate to your project root
   cd /Users/mac/Documents/GitHub/Healify
   
   # Move the downloaded file here
   # The file should be at the project root, same level as app.json
   mv ~/Downloads/GoogleService-Info.plist ./
   ```

2. **For Android - google-services.json**
   ```bash
   # Move the downloaded file to project root
   mv ~/Downloads/google-services.json ./
   ```

3. **Verify Files Are in Place**
   ```bash
   ls -la | grep -E "GoogleService|google-services"
   ```
   
   You should see:
   ```
   -rw-r--r--  GoogleService-Info.plist
   -rw-r--r--  google-services.json
   ```

---

### Step 7: Configure Environment Variables

1. **Get Firebase Configuration Values**
   - In Firebase Console → Project Settings → General
   - Scroll to "Your apps" → Select your Web app (or create one if needed)
   - You'll see "Firebase SDK snippet" → Choose **"Config"**
   - Copy the configuration values

2. **Update .env.local**
   ```bash
   # Create .env.local from example
   cp .env.example .env.local
   
   # Edit the file
   nano .env.local
   ```

3. **Add Firebase Configuration**
   ```env
   # API Configuration
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
   
   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=healify-xxxxx.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=healify-xxxxx
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=healify-xxxxx.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   
   # Feature Flags
   EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
   EXPO_PUBLIC_ENABLE_LOCATION_SERVICES=true
   ```

4. **Save and Close**
   - Press `Ctrl + X`, then `Y`, then `Enter`

---

### Step 8: Install Dependencies

```bash
# Navigate to project root
cd /Users/mac/Documents/GitHub/Healify

# Install all dependencies
npm install

# This will install:
# - @react-native-firebase/app
# - @react-native-firebase/messaging
# - @react-native-community/netinfo
# - expo-task-manager
```

---

### Step 9: Update .gitignore

```bash
# Add to .gitignore to prevent committing sensitive files
echo "GoogleService-Info.plist" >> .gitignore
echo "google-services.json" >> .gitignore
echo ".env.local" >> .gitignore
```

---

## Part 3: Backend Configuration

### Step 10: Configure Notification Microservice

1. **Place Service Account Key**
   ```bash
   # Navigate to NotificationMicroservice
   cd /Users/mac/Documents/GitHub/Healify/Server/NotificationMicroservice
   
   # Copy the service account key here
   cp ~/Downloads/serviceAccountKey.json ./
   ```

2. **Create .env File**
   ```bash
   # Create from example
   cp .env.example .env
   
   # Edit the file
   nano .env
   ```

3. **Configure Environment Variables**
   ```env
   # Option 1: Use service account file (RECOMMENDED for development)
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   
   # Server Configuration
   PORT=3003
   
   # RabbitMQ Configuration
   RABBITMQ_URL=amqp://localhost:5672
   ```

   **OR for production (Option 2):**
   ```env
   # Use environment variables instead of file
   FIREBASE_PROJECT_ID=healify-xxxxx
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@healify-xxxxx.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
   
   PORT=3003
   RABBITMQ_URL=amqp://localhost:5672
   ```

4. **Update .gitignore**
   ```bash
   echo "serviceAccountKey.json" >> .gitignore
   echo ".env" >> .gitignore
   ```

---

### Step 11: Configure Chat Microservice

```bash
# Navigate to ChatMicroservice
cd /Users/mac/Documents/GitHub/Healify/Server/ChatMicroservice

# Create .env from example
cp .env.example .env

# Edit with your values
nano .env
```

Add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

MONGODB_URI=mongodb://localhost:27017/healify_chat
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
PORT=3001
```

---

## Part 4: Testing

### Step 12: Test Mobile App

1. **Start Metro Bundler**
   ```bash
   cd /Users/mac/Documents/GitHub/Healify
   npm start
   ```

2. **Run on Physical Device (REQUIRED for push notifications)**
   
   **For iOS:**
   ```bash
   # In a new terminal
   npm run ios
   ```
   
   **For Android:**
   ```bash
   npm run android
   ```

3. **Complete Onboarding**
   - Open the app on your device
   - Go through onboarding screens
   - When prompted, **grant notification permission**
   - Sign up or log in

4. **Check Logs for Push Token**
   - Look in Metro bundler logs for:
   ```
   [Notifications] Expo Push Token: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
   [AuthContext] Push notification token registered
   ```

---

### Step 13: Test Backend Notification Service

1. **Start RabbitMQ** (if not running)
   ```bash
   # macOS with Homebrew
   brew services start rabbitmq
   ```

2. **Start Notification Microservice**
   ```bash
   cd /Users/mac/Documents/GitHub/Healify/Server/NotificationMicroservice
   npm start
   ```
   
   You should see:
   ```
   [Notification] Initializing Firebase...
   [Notification] Firebase initialized successfully
   [Notification] RabbitMQ connected successfully
   [Notification] Microservice listening on port 3003
   ```

3. **Send Test Notification**
   ```bash
   # Replace YOUR_TOKEN with the actual token from Step 12
   curl -X POST http://localhost:3003/send-test \
     -H "Content-Type: application/json" \
     -d '{
       "token": "ExponentPushToken[YOUR_TOKEN_HERE]",
       "title": "Test from Healify",
       "body": "If you see this, Firebase is working! 🎉"
     }'
   ```

4. **Check Your Device**
   - You should receive a notification
   - If you don't see it, check the backend logs for errors

---

## Troubleshooting

### Issue: "Firebase initialization failed"

**Solution:**
- Verify `serviceAccountKey.json` is in the correct location
- Check the file has valid JSON format
- Ensure environment variables are set correctly

### Issue: "No push token received"

**Solution:**
- Ensure you're using a **physical device** (not simulator)
- Check notification permissions are granted
- Verify `GoogleService-Info.plist` and `google-services.json` are in project root
- Try restarting the app

### Issue: "Invalid registration token"

**Solution:**
- The token may have expired
- Log out and log back in to get a new token
- Check the token format is correct (starts with `ExponentPushToken[`)

### Issue: "Cloud Messaging API disabled"

**Solution:**
- Go to Firebase Console → Cloud Messaging
- Click "Enable" to activate the API
- Wait a few minutes for propagation

---

## Security Checklist

Before deploying to production:

- [ ] `serviceAccountKey.json` is in `.gitignore`
- [ ] `GoogleService-Info.plist` is in `.gitignore`
- [ ] `google-services.json` is in `.gitignore`
- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] Firebase security rules are configured
- [ ] API keys are stored in environment variables
- [ ] Service account key is stored securely (not in code)

---

## Next Steps

Once Firebase is set up and tested:

1. **Configure notification templates** in `notification-formatter.js`
2. **Set up notification triggers** in your backend services
3. **Test different notification types** (health alerts, chat messages)
4. **Monitor notification delivery** in Firebase Console
5. **Set up analytics** to track notification engagement

---

## Useful Links

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Docs](https://rnfirebase.io/)
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)

---

## Support

If you encounter issues:

1. Check Firebase Console for error messages
2. Review backend logs in NotificationMicroservice
3. Verify all configuration files are in place
4. Ensure all dependencies are installed
5. Check that RabbitMQ and other services are running

---

**🎉 Congratulations!** Your Firebase setup is complete. You can now send push notifications to your Healify app users!
