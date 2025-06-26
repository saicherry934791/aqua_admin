import type React from "react"
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native"

interface TextareaProps extends TextInputProps {
  label?: string
  error?: string
  rows?: number
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, rows = 4, style, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.textarea, { height: rows * 20 + 16 }, error && styles.error, style]}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#71717a"
        {...props}
      />
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
  textarea: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 48,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  error: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Outfit_400Regular',
  },
})
