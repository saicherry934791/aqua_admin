"use client"

import type React from "react"
import { useCallback, useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native"
import { Button } from "../ui/button"
import { FormField, type FormFieldConfig } from "./form-field"
import { FormValidator } from "./form-validator"
import { RepeatableSection } from "./repeatable-section"

export interface FormSection {
  id: string
  title?: string
  fields?: FormFieldConfig[]
  repeatable?: {
    fields: FormFieldConfig[]
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
  const [values, setValues] = useState<any>(initialValues)
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateValue = useCallback(
    (sectionId: string, fieldId: string, value: any) => {
      setValues((prev: any) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [fieldId]: value,
        },
      }))

      // Clear error when user starts typing
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

      // Clear errors for this section
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
        console.log('id ',section.id)
        const sectionValues = values[section.id] || []
        console.log('values of repetable ',sectionValues)
        console.log('section.repeatable.fields ',section.repeatable.fields)
        const validation = FormValidator.validateRepeatableSection(section.repeatable.fields, sectionValues)
        console.log('validation is ',validation)
        if (!validation.isValid) {
          newErrors[section.id] = validation.errors
          isValid = false
        }
      }
    })

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}

          {section.fields && (
            <View>
              {section.fields.map((field) => (
                <FormField
                  key={field.id}
                  config={field}
                  value={values[section.id]?.[field.id]}
                  onChange={(value) => updateValue(section.id, field.id, value)}
                  error={errors[section.id]?.[field.id]}
                />
              ))}
            </View>
          )}

          {section.repeatable && (
            <RepeatableSection
              title={section.title || "Items"}
              fields={section.repeatable.fields}
              values={values[section.id] || [{}]}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#18181b",
    marginBottom: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  submitContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
})
