import type React from "react"
import { StyleSheet, Text, TextInput, View, type TextInputProps, Platform } from "react-native"

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  variant?: "default" | "outline"
}

export const Input: React.FC<InputProps> = ({ label, error, variant = "default", style, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, styles[variant], error && styles.error, style]}
        placeholderTextColor="#71717a"
        scrollEnabled={false}
        textContentType="none"
        autoComplete="off"
        spellCheck={false}
        autoCorrect={false}
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
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000000",
    minHeight: 48,
    maxHeight: 48,
    fontFamily: 'Outfit_400Regular',
    ...(Platform.OS === 'ios' && {
      paddingTop: 12,
      paddingBottom: 12,
    }),
  },
  default: {
    backgroundColor: "#f4f4f5",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e4e4e7",
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
