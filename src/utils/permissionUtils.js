import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Alert, Linking } from 'react-native';

/**
 * Request and check camera permissions
 * Returns true if granted, false otherwise
 */
export const requestCameraPermission = async () => {
    try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Camera Permission Required',
                'Face verification needs camera access to work. Please enable it in settings.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Settings', onPress: () => Linking.openSettings() }
                ]
            );
            return false;
        }
        return true;
    } catch (error) {
        console.error('Camera permission error:', error);
        return false;
    }
};

/**
 * Request and check location permissions
 * Returns true if granted, false otherwise
 */
export const requestLocationPermission = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Location Permission Required',
                'Attendance verification needs your location to confirm you are in the office zone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Settings', onPress: () => Linking.openSettings() }
                ]
            );
            return false;
        }
        return true;
    } catch (error) {
        console.error('Location permission error:', error);
        return false;
    }
};
