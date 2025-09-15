import * as ImagePicker from "expo-image-picker"
import React from "react"
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"

type FileSource = {
  uri: string
  isNew: boolean
  name?: string
  mimeType?: string
}

interface FilePickerProps {
  label?: string
  value?: FileSource[]
  onValueChange?: (files: FileSource[]) => void
  onChange?: (files: FileSource[]) => void
  multiple?: boolean
  accept?: 'all' | 'images'
  error?: string
}

export const FilePicker: React.FC<FilePickerProps> = ({
  label,
  value = [],
  onValueChange,
  onChange,
  multiple = false,
  accept = 'all',
  error,
}) => {
  const emitChange = (files: FileSource[]) => {
    if (typeof onValueChange === 'function') return onValueChange(files)
    if (typeof onChange === 'function') return onChange(files)
    console.warn('FilePicker: no change handler provided')
  }
  const pickDocument = async () => {
    try {
      let DocumentPicker: any
      try {
        DocumentPicker = await import("expo-document-picker")
      } catch (e) {
        Alert.alert(
          "Install Required",
          "Please install expo-document-picker to select PDFs.",
          [{ text: "OK" }]
        )
        return
      }

      const typeFilters = accept === 'images' ? ["image/*"] : ["application/pdf", "image/*"]
      const res: any = await DocumentPicker.getDocumentAsync({
        type: typeFilters,
        multiple,
        copyToCacheDirectory: true,
      })

      const picked = (res?.assets && Array.isArray(res.assets) ? res.assets : [res])
        .filter((a: any) => a && (a.uri || a.file))
        .map((a: any) => ({
          uri: a.uri || a.file?.uri,
          name: a.name || a.file?.name,
          mimeType: a.mimeType || a.file?.mimeType || (a.name?.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          isNew: true,
        }))

      if (picked.length === 0) return

      if (multiple) {
        const existingUris = new Set(value.map((f) => f.uri))
        const unique = picked.filter((f: FileSource) => !existingUris.has(f.uri))
        emitChange([...value, ...unique])
      } else {
        emitChange([picked[0]])
      }
    } catch (error) {
      console.log("Error picking document:", error)
      Alert.alert("Error", "Failed to select document")
    }
  }

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: multiple,
        quality: 0.8,
      })

      if (!result.canceled && result.assets) {
        const files: FileSource[] = result.assets.map((asset) => ({
          uri: asset.uri,
          isNew: true,
          name: asset.fileName || `image-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
        }))

        if (multiple) {
          const existingUris = new Set(value.map((f) => f.uri))
          const unique = files.filter((f) => !existingUris.has(f.uri))
          emitChange([...value, ...unique])
        } else {
          emitChange([files[0]])
        }
      }
    } catch (error) {
      console.log("Error picking images:", error)
      Alert.alert("Error", "Failed to select images")
    }
  }

  const handlePress = () => {
    const buttons: any[] = []
    if (accept !== 'images') {
      buttons.push({ text: "Upload PDF", onPress: pickDocument })
    }
    buttons.push({ text: "Upload Image", onPress: pickFromLibrary })
    buttons.push({ text: "Cancel", style: "cancel" })

    Alert.alert(
      multiple ? "Select Files" : "Select File",
      "Choose source",
      buttons,
      { cancelable: true }
    )
  }

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    emitChange(newFiles)
  }

  const getPickerText = () => {
    if (value.length === 0) return multiple ? "Select Files" : "Select File"
    return `${value.length} file${value.length > 1 ? 's' : ''} selected`
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.picker, error && styles.error]}
        onPress={handlePress}
        activeOpacity={0.7}
        delayPressIn={0}
      >
        <Text style={styles.pickerText}>{getPickerText()}</Text>
      </TouchableOpacity>

      {value.length > 0 && (
        <View style={styles.fileContainer}>
          {value.map((file, index) => {
            const isImage = (file.mimeType || '').startsWith('image') || (!file.mimeType && !file.name?.endsWith('.pdf'))
            return (
              <View key={index} style={styles.fileWrapper}>
                {isImage ? (
                  <Image source={{ uri: file.uri }} style={styles.preview} />
                ) : (
                  <View style={styles.pdfBox}>
                    <Text style={styles.pdfText}>PDF</Text>
                  </View>
                )}
                <Text style={styles.fileName} numberOfLines={1}>{file.name || file.uri?.split('/').pop()}</Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeFile(index)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            )
          })}
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
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
    justifyContent: 'center',
  },
  error: { borderColor: "#ef4444" },
  pickerText: {
    fontSize: 16,
    color: "#18181b",
    fontFamily: 'Outfit_400Regular',
  },
  fileContainer: {
    marginTop: 12,
    gap: 8,
  },
  fileWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  pdfBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfText: { color: '#3B82F6', fontWeight: '700' },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontFamily: 'Outfit_400Regular',
  },
  removeButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  removeText: { color: 'white', fontWeight: '700' },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Outfit_400Regular',
  },
})


