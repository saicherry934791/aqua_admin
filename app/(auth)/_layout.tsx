import { useAuth } from "@/lib/contexts/AuthContext";
import { router, Stack } from "expo-router";
import { useEffect, useLayoutEffect } from "react";



export default function AuthLayout() {
    const { isAuthenticated } = useAuth()

    useLayoutEffect(() => {
        if (isAuthenticated) {
            router.replace("/(tabs)");
        }
    }, [isAuthenticated]);

    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: true }} />
            <Stack.Screen name="otp" options={{ headerShown: true, headerShadowVisible: false }} />

        </Stack>
    )
}