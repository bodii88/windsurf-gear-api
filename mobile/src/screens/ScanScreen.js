import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { RNCamera } from 'react-native-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScanScreen = ({ navigation }) => {
  const [scanning, setScanning] = useState(true);

  const onBarCodeRead = async ({ data }) => {
    if (!scanning) return;
    
    setScanning(false);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `http://10.0.2.2:5000/api/items/${data}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      navigation.navigate('ItemDetails', { item: response.data });
    } catch (error) {
      Alert.alert('Error', 'Invalid QR code or item not found');
      setScanning(true);
    }
  };

  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        onBarCodeRead={onBarCodeRead}
        captureAudio={false}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
        <Text style={styles.instructions}>
          Point camera at a QR code to scan
        </Text>
      </RNCamera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  instructions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
  },
});

export default ScanScreen;
