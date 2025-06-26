import * as ImagePicker from "expo-image-picker"
import { X } from "lucide-react-native"
import type React from "react"
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"

// Define a type that can handle both local and remote images
type ImageSource = {
  uri: string;
  isNew: boolean; // Flag to distinguish between existing and newly added images
}

interface ImagePickerComponentProps {
  label?: string
  value?: ImageSource[];
  onValueChange: (images: ImageSource[]) => void
  multiple?: boolean
  error?: string
}

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  label,
  value = [],
  onValueChange,
  multiple = false,
  error,
}) => {
  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: multiple, // only works on iOS 14+
        quality: 0.8,
      });
  
      if (!result.canceled && result.assets) {
        const newImages: ImageSource[] = result.assets.map((asset) => ({
          uri: asset.uri,
          isNew: true,
        }));
  
        // Always add, don't replace, even if multiple selection isn't supported
        const existingUris = new Set(value.map((img) => img.uri));
        const uniqueNewImages = newImages.filter((img) => !existingUris.has(img.uri));
  
        onValueChange([...value, ...uniqueNewImages]);
      }
    } catch (error) {
      console.log("Error picking images:", error);
      Alert.alert("Error", "Failed to select images");
    }
  };
  
  const pickFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      })

      if (!result.canceled && result.assets) {
        const newImages: ImageSource[] = result.assets.map((asset) => ({
          uri: asset.uri,
          isNew: true
        }));

        if (multiple) {
          // Add to existing images
          onValueChange([...value, ...newImages])
        } else {
          // Replace existing image
          onValueChange(newImages)
        }
      }
    } catch (error) {
      console.log('Error taking photo:', error)
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const handlePress = () => {
    Alert.alert(
      multiple ? "Select Images" : "Select Image",
      "",
      [
        { text: "Camera", onPress: pickFromCamera },
        { text: "Photo Library", onPress: pickFromLibrary },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    )
  }

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index)
    onValueChange(newImages)
  }

  const getPickerText = () => {
    if (value.length === 0) {
      return multiple ? "Select Images" : "Select Image"
    }
    return `${value.length} image${value.length > 1 ? 's' : ''} selected`
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={[styles.picker, error && styles.error]} onPress={handlePress}>
        <Text style={styles.pickerText}>{getPickerText()}</Text>
      </TouchableOpacity>
      <View style={styles.imageContainer}>
        {value.map((imageSource, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image 
              source={{ uri: imageSource.uri }} 
              style={styles.image} 
            />
            {imageSource.isNew && (
              <View style={styles.newImageOverlay}>
                <Text style={styles.newImageText}>New</Text>
              </View>
            )}
            <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
              <X size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#18181b",
    marginBottom: 6,
    fontFamily: 'Outfit_600SemiBold',
  },
  picker: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 40,
  },
  error: {
    borderColor: "#ef4444",
  },
  pickerText: {
    fontSize: 16,
    color: "#18181b",
    fontFamily: 'Outfit_400Regular',
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Outfit_400Regular',
  },
  newImageOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newImageText: {
    color: 'white',
    fontSize: 10,
  },
})