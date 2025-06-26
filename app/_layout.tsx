import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { useColorScheme } from '@/lib/hooks/useColorScheme';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts
} from '@expo-google-fonts/outfit';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'expo-dev-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Keyboard,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SheetProvider } from "react-native-actions-sheet";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import "../sheets";

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated } = useAuth();
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SheetProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DefaultTheme : DefaultTheme}>
          {/* <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          > */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <Stack initialRouteName='(tabs)'>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="franchise" options={{ headerShown: false }} />
                <Stack.Screen name="products" options={{ headerShown: false }} />
                <Stack.Screen name="agents" options={{ headerShown: false }} />
                <Stack.Screen name="services" options={{ headerShown: false }} />
                <Stack.Screen name="orders" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </View>
          </TouchableWithoutFeedback>
          {/* </KeyboardAvoidingView> */}
        </ThemeProvider>
      </SheetProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
