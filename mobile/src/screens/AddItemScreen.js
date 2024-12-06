import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddItemScreen = ({ navigation }) => {
  const [itemData, setItemData] = useState({
    name: '',
    brand: '',
    model: '',
    quantity: '1',
    location: '',
    category: 'gear',
    notes: '',
  });

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        'http://10.0.2.2:5000/api/items',
        itemData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Success', 'Item added successfully');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add item');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Item</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={itemData.name}
        onChangeText={(text) => setItemData({ ...itemData, name: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Brand"
        value={itemData.brand}
        onChangeText={(text) => setItemData({ ...itemData, brand: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Model"
        value={itemData.model}
        onChangeText={(text) => setItemData({ ...itemData, model: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Quantity"
        value={itemData.quantity}
        onChangeText={(text) => setItemData({ ...itemData, quantity: text })}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Location (e.g., Car Trunk, Garage)"
        value={itemData.location}
        onChangeText={(text) => setItemData({ ...itemData, location: text })}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={itemData.category}
          onValueChange={(value) => setItemData({ ...itemData, category: value })}
          style={styles.picker}
        >
          <Picker.Item label="Gear" value="gear" />
          <Picker.Item label="Camping" value="camping" />
          <Picker.Item label="Tools" value="tools" />
          <Picker.Item label="Vehicle" value="vehicle" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Notes (maintenance history, condition, etc.)"
        value={itemData.notes}
        onChangeText={(text) => setItemData({ ...itemData, notes: text })}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Add Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddItemScreen;
