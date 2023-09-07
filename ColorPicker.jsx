import React from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

const ColorPicker = ({ selectedColor, onColorChange }) => {
  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#00FFFF",
    "#FF00FF",
    "#C0C0C0",
    "#808080",
    "#800000",
    "#808000",
    "#008000",
    "#800080",
    "#008080",
    "#000080",
    "#FFA500",


  
];

  return (
    <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center" }}
    >
      <View style={styles.colorPickerContainer}>
        {colors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              {
                backgroundColor: color,
                borderColor: selectedColor === color ? "black" : "transparent",
              },
            ]}
            onPress={() => onColorChange(color)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  colorPickerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 2,
  },
});

export default ColorPicker;
