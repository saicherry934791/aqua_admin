"use client"

import type React from "react"
import { useCallback, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { Button } from "../ui/button"
import { ImagePickerComponent } from "../ui/image-picker"
import { FormFieldConfig as BaseFormFieldConfig, FormField } from "./form-field"
import { FormValidator } from "./form-validator"
import { RepeatableSection } from "./repeatable-section"

// Define a union type for extended field types
type ExtendedFieldType = BaseFormFieldConfig['type'] | 'image'

// Create a custom type that includes additional properties
export type DynamicFormFieldConfig = Omit<BaseFormFieldConfig, 'type'> & {
  type: ExtendedFieldType
  multiple?: boolean
}

export interface FormSection {
  id: string
  title?: string
  fields?: DynamicFormFieldConfig[]
  repeatable?: {
    fields: DynamicFormFieldConfig[]
    minItems?: number
    maxItems?: number
  }
}

interface DynamicFormProps {
  sections: FormSection[]
  initialValues?: any
  onSubmit: (values: any) => Promise<void>
  onSuccess?: (values: any) => void
  onError?: (error: Error) => void
  submitButtonText?: string
  loading?: boolean
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  sections,
  initialValues = {},
  onSubmit,
  onSuccess,
  onError,
  submitButtonText = "Submit",
  loading = false,
}) => {
  const [values, setValues] = useState<any>(() => {
    const initial: any = { ...initialValues };
    sections.forEach(section => {
      if (section.repeatable) {
        if (!Array.isArray(initial[section.id]) || initial[section.id].length === 0) {
          // Only initialize with an empty item if initialValues for this section are truly empty.
          // This prevents initial required errors if nothing is provided.
          if (!initialValues[section.id] || initialValues[section.id].length === 0) {
            initial[section.id] = [{}];
          }
        }
      }
    });
    return initial;
  });
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateValue = useCallback(
    (sectionId: string, fieldId: string, value: any) => {
     console.log('value before is ',value)
      setValues((prev: any) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [fieldId]: value,
        },
      }))
      console.log('values is in change  ',values)

      // Clear error when user starts typing after a submission attempt
      if (errors[sectionId]?.[fieldId]) {
        setErrors((prev: any) => ({
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            [fieldId]: undefined,
          },
        }))
      }
    },
    [errors],
  )

  const updateRepeatableValues = useCallback(
    (sectionId: string, newValues: any[]) => {
      setValues((prev: any) => ({
        ...prev,
        [sectionId]: newValues,
      }))

      // Clear errors for this section after a submission attempt
      if (errors[sectionId]) {
        setErrors((prev: any) => ({
          ...prev,
          [sectionId]: {},
        }))
      }
    },
    [errors],
  )

  const validateForm = (): boolean => {
    const newErrors: any = {}
    let isValid = true

    sections.forEach((section) => {
      if (section.fields) {
        // Validate regular fields
        const sectionValues = values[section.id] || {}
        const validation = FormValidator.validateForm(section.fields, sectionValues)

        if (!validation.isValid) {
          newErrors[section.id] = validation.errors
          isValid = false
        }
      } else if (section.repeatable) {
        // Validate repeatable section
        const sectionValues = Array.isArray(values[section.id]) && values[section.id].length > 0 ? values[section.id] : [{}]
        const validation = FormValidator.validateRepeatableSection(
          section.repeatable.fields,
          sectionValues,
          section.repeatable.minItems,
          section.repeatable.maxItems
        )

        if (!validation.isValid) {
          newErrors[section.id] = validation.errors
          isValid = false
        }
      }
    })

    console.log('newErrors ', newErrors)

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async () => {
    // First validate all fields
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix all errors before submitting the form.")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
      onSuccess?.(values)
      Alert.alert("Success", "Form submitted successfully!")
    } catch (error) {
      onError?.(error as Error)
      Alert.alert("Error", "Failed to submit form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Custom render method for different field types
  const renderField = (section: FormSection, field: DynamicFormFieldConfig) => {
    // Special handling for image fields
    if (field.type === 'image') {
      return (
        <ImagePickerComponent
          key={field.id}
          label={field.label}
          value={values[section.id]?.[field.id] || []}
          onValueChange={(images) => updateValue(section.id, field.id, images)}
          multiple={field.multiple}
          error={errors[section.id]?.[field.id]}
        />
      )
    }

    // Default to standard FormField for other types
    return (
      <FormField
        key={field.id}
        config={field as BaseFormFieldConfig}
        value={values[section.id]?.[field.id]}
        onChange={(value) => updateValue(section.id, field.id, value)}
        error={errors[section.id]?.[field.id]}
      />
    )
  }

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}

            {section.fields && (
              <View>
                {section.fields.map((field) => renderField(section, field))}
              </View>
            )}

            {section.repeatable && (
              <RepeatableSection
                title={section.title || "Items"}
                fields={section.repeatable.fields as BaseFormFieldConfig[]}
                values={Array.isArray(values[section.id]) && values[section.id].length > 0 ? values[section.id] : [{}]}
                onChange={(newValues) => updateRepeatableValues(section.id, newValues)}
                errors={errors[section.id]}
                minItems={section.repeatable.minItems}
                maxItems={section.repeatable.maxItems}
              />
            )}
          </View>
        ))}

        <View style={styles.submitContainer}>
          <Button
            title={isSubmitting ? "Submitting..." : submitButtonText}
            onPress={handleSubmit}
            disabled={isSubmitting || loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white'
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#18181b",
    marginBottom: 16,
    fontFamily: 'Outfit_700Bold',
  },
  submitContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
})
