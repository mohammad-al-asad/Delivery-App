import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface FileUploadProps {
    label: string;
    onImageSelected: (uri: string) => void;
    imageUri?: string;
    error?: string;
}

export const FileUpload = ({ label, onImageSelected, imageUri, error }: FileUploadProps) => {
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            onImageSelected(result.assets[0].uri);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity onPress={pickImage} style={[styles.uploadBox, error ? styles.errorBorder : null]}>
                {imageUri ? (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: imageUri }} style={styles.image} />
                        <View style={styles.editOverlay}>
                            <Ionicons name="pencil" size={20} color="#fff" />
                        </View>
                    </View>
                ) : (
                    <View style={styles.placeholder}>
                        <Ionicons name="cloud-upload-outline" size={32} color={Colors.textLight} />
                        <Text style={styles.uploadText}>Tap to upload</Text>
                    </View>
                )}
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    uploadBox: {
        height: 150,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#EFEFEF',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    errorBorder: {
        borderColor: 'red',
    },
    placeholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 8,
        color: Colors.textLight,
        fontSize: 14,
    },
    imageContainer: {
        width: '100%',
        height: '100%',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    editOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
});
