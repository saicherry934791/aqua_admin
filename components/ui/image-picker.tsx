import * as ImagePicker from "expo-image-picker"
import { X } from "lucide-react-native"
import type React from "react"
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface ImagePickerComponentProps {
  label?: string
  value?: string[]
  onValueChange: (images: string[]) => void
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
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload images.")
      return false
    }
    return true
  }

  const pickImage = async (useCamera = false) => {
    const hasPermission = await requestPermission()
    if (!hasPermission) return

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: multiple,
    }

    let result
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera permissions to take photos.")
        return
      }
      result = await ImagePicker.launchCameraAsync(options)
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options)
    }

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri)
      if (multiple) {
        onValueChange([...value, ...newImages])
      } else {
        onValueChange(newImages)
      }
    }
  }

  const handlePress = () => {
    const options = ["Camera", "Photo Library", "Cancel"]

    // Using Alert for a simple action sheet like behavior since useActionSheet is removed
    Alert.alert(
      "Select Image",
      "",
      [
        { text: "Camera", onPress: () => pickImage(true) },
        { text: "Photo Library", onPress: () => pickImage(false) },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    )
  }

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index)
    onValueChange(newImages)
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={[styles.picker, error && styles.error]} onPress={handlePress}>
        <Text style={styles.pickerText}>{value.length > 0 ? `${value.length} image(s) selected` : "Select Image"}</Text>
      </TouchableOpacity>
      <View style={styles.imageContainer}>
        {value.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />
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
    fontFamily: 'PlusJakartaSans_600SemiBold',
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
    fontFamily: 'PlusJakartaSans_400Regular',
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
    fontFamily: 'PlusJakartaSans_400Regular',
  },
})
