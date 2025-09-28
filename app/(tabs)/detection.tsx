import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, View } from 'react-native';

const DISEASES = [
  { name: 'Early Blight', description: 'Dark spots on leaves.', prevention: 'Use fungicide.' },
  { name: 'Late Blight', description: 'Brown lesions on fruits.', prevention: 'Remove infected plants.' },
  { name: 'Leaf Mold', description: 'Yellow spots on leaves.', prevention: 'Improve air circulation.' },
  { name: 'Healthy', description: 'No disease detected.', prevention: 'Maintain care.' }
];

export default function DetectionScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled) setImageUri(res.assets[0].uri);
    setResult(null);
  };

  const analyzeImage = () => {
    if (!imageUri) return;
    setLoading(true);
    setTimeout(() => {
      const selected: any[] = [];
      while (selected.length < 2) {
        const disease = DISEASES[Math.floor(Math.random() * DISEASES.length)];
        if (!selected.includes(disease)) selected.push(disease);
      }
      setResult(selected.map(d => `${d.name}: ${d.description} | Prevention: ${d.prevention}`).join('\n\n'));
      setLoading(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {!imageUri ? (
        <Button title="Pick Image from Gallery" onPress={pickImage} />
      ) : (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <Button title="Retake" onPress={() => setImageUri(null)} />
          <Button title="Analyze (Offline)" onPress={analyzeImage} disabled={loading} />
        </>
      )}
      {loading && <ActivityIndicator size="large" color="green" />}
      {result && <Text style={styles.result}>{result}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  
  result: { marginTop: 10, fontSize: 16, color: 'black' },
   container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: 300,
    height: 300,
    borderRadius: 15,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 20,
    marginTop: 15,
  },
  resultBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});
