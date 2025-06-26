"use client"

import type React from "react"
import { View } from "react-native"
import { Input } from "../ui/input"
import { Textarea } from "../ui/text-area"
import { Select } from "../ui/select"
import { ImagePickerComponent } from "../ui/image-picker"

export interface FormFieldConfig {
  id: string
  type: "text" | "textarea" | "select" | "multiselect" | "image" | "custom"
  label?: string
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: any) => string | null
  }
  customComponent?: React.ComponentType<{
    label?: string
    value: any
    onChange: (value: any) => void
    error?: string
    [key: string]: any
  }>
  props?: any
}

interface FormFieldProps {
  config: FormFieldConfig
  value: any
  onChange: (value: any) => void
  error?: string
}

export const FormField: React.FC<FormFieldProps> = ({ config, value, onChange, error }) => {
  const renderField = () => {
    switch (config.type) {
      case "text":
        return (
          <Input
            label={config.label}
            placeholder={config.placeholder}
            value={value || ""}
            onChangeText={onChange}
            error={error}
            {...config.props}
          />
        )

      case "textarea":
        return (
          <Textarea
            label={config.label}
            placeholder={config.placeholder}
            value={value || ""}
            onChangeText={onChange}
            error={error}
            {...config.props}
          />
        )

      case "select":
        return (
          <Select
            label={config.label}
            placeholder={config.placeholder}
            options={config.options || []}
            value={value}
            onValueChange={onChange}
            error={error}
            multiple={false}
            {...config.props}
          />
        )

      case "multiselect":
        return (
          <Select
            label={config.label}
            placeholder={config.placeholder}
            options={config.options || []}
            value={value}
            onValueChange={onChange}
            error={error}
            multiple={true}
            {...config.props}
          />
        )

      case "image":
        return (
          <ImagePickerComponent
            label={config.label}
            value={value || []}
            onValueChange={onChange}
            error={error}
            {...config.props}
          />
        )

      case "custom":
        if (config.customComponent) {
          const CustomComponent = config.customComponent
          return (
            <CustomComponent label={config.label} value={value} onChange={onChange} error={error} {...config.props} />
          )
        }
        return null

      default:
        return null
    }
  }

  return <View>{renderField()}</View>
}
