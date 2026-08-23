import { Stack } from 'expo-router';

export default function DriverStackLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="about-us" />
            <Stack.Screen name="change-password" />
            <Stack.Screen name="contact-us" />
            <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
            <Stack.Screen name="vehicle-info" options={{ title: 'Vehicle Information' }} />
            <Stack.Screen name="documents" options={{ title: 'Documents' }} />
            <Stack.Screen name="help-center" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="privacy-policy" />
            <Stack.Screen name="referral" />
            <Stack.Screen name="terms-of-service" />
            <Stack.Screen name="ride-details" />
        </Stack>
    );
}
