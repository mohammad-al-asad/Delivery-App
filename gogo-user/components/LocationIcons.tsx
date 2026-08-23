import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export const PickupIcon = ({ size = 24 }: { size?: number }) => (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Image
            source={require('../assets/pick.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
        />
    </View>
);

export const DropoffIcon = ({ size = 24 }: { size?: number }) => (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Image
            source={require('../assets/drop.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
        />
    </View>
);

const styles = StyleSheet.create({});
