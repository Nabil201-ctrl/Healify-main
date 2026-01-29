import { View, ActivityIndicator } from 'react-native';
import tw from 'twrnc';

/**
 * This is the initial screen of the application.
 * It is responsible for showing a loading indicator while the root layout
 * determines the authentication state and redirects the user.
 * This component should not contain any routing logic itself.
 */
export default function StartPage() {
  return (
    <View style={tw`flex-1 justify-center items-center bg-white`}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  );
}