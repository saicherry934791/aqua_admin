import type React from "react"
import { StyleSheet, Text, TouchableOpacity, type TextStyle, type ViewStyle } from "react-native"

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "default",
  size = "md",
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], styles[`${size}Size`], disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  default: {
    backgroundColor: "#18181b",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: "#ef4444",
  },
  disabled: {
    opacity: 0.5,
  },
  smSize: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  mdSize: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  lgSize: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
  },
  text: {
    fontWeight: "500",
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  defaultText: {
    color: "#fafafa",
  },
  outlineText: {
    color: "#18181b",
  },
  ghostText: {
    color: "#18181b",
  },
  destructiveText: {
    color: "#fafafa",
  },
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 16,
  },
})
