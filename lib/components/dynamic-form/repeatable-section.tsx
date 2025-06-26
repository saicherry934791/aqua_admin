"use client"

import type React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Button } from "../ui/button"
import { FormField, type FormFieldConfig } from "./form-field"

interface RepeatableSectionProps {
  title: string
  fields: FormFieldConfig[]
  values: any[]
  onChange: (values: any[]) => void
  errors?: { [key: number]: { [key: string]: string }; _section?: string }
  minItems?: number
  maxItems?: number
}

export const RepeatableSection: React.FC<RepeatableSectionProps> = ({
  title,
  fields,
  values,
  onChange,
  errors = {},
  minItems = 1,
  maxItems = 10,
}) => {
  // Debug logging
  console.log('RepeatableSection values:', values);
  console.log('RepeatableSection errors:', errors);

  const addItem = () => {
    if (values.length < maxItems) {
      const newItem: any = {}
      fields.forEach((field) => {
        newItem[field.id] = field.type === "image" ? [] : ""
      })
      onChange([...values, newItem])
    }
  }

  const removeItem = (index: number) => {
    if (values.length > minItems) {
      const newValues = values.filter((_, i) => i !== index)
      onChange(newValues)
    }
  }

  const updateItem = (index: number, fieldId: string, value: any) => {
    const newValues = [...values]
    newValues[index] = { ...newValues[index], [fieldId]: value }
    onChange(newValues)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {values.length < maxItems && <Button title="Add" onPress={addItem} variant="outline" size="sm" />}
      </View>

      {errors._section && (
        <Text style={{ color: '#ef4444', marginBottom: 8 }}>{errors._section}</Text>
      )}

      {values.map((item, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.itemHeader}>
            {/* <Text style={styles.itemTitle}>{`${title} ${index + 1}`}</Text> */}
            {values.length > minItems && (
              <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          {fields.map((field) => {
            console.log('Error for item', index, 'field', field.id, ':', errors[index]?.[field.id]);
            return (
              <FormField
                key={field.id}
                config={field}
                value={item[field.id]}
                onChange={(value) => updateItem(index, field.id, value)}
                error={errors[index]?.[field.id]}
              />
            );
          })}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    fontFamily:'Outfit_600SemiBold'
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#18181b",
    fontFamily: 'Outfit_600SemiBold',
  },
  item: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    fontFamily:'Outfit_600SemiBold'
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#18181b",
    fontFamily: 'Outfit_600SemiBold',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fee2e2",
    borderRadius: 6,
  },
  removeText: {
    color: "#ef4444",
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  },
})
