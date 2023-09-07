// WelcomeScreen.js

import React from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const WelcomeScreen = ({ navigation }) => {
  return (
    <ImageBackground
      source={require("./assets/Welcome.jpg")} // Replace with your image path
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => {
              // Navigate to your main app screen after clicking "Get Started"
              navigation.navigate("Home");
            }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
   justifyContent:'center',
    justifyContent: "flex-end", // Align content at the bottom
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Add some padding at the bottom
  },
  text: {
    fontSize: 24,
    color: "white",
    marginBottom: 20,
  },
  getStartedButton: {
    backgroundColor: "teal",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    textAlign: "center", // Center the text within the button
  },
});

export default WelcomeScreen;
