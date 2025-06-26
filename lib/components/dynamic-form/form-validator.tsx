import type { FormFieldConfig } from "./form-field"

export interface ValidationResult {
  isValid: boolean
  errors: { [key: string]: string }
}

export class FormValidator {
  static validateField(config: FormFieldConfig, value: any): string | null {
    // Required validation
    if (config.required) {
      if (value === null || value === undefined || value === "") {
        return `${config.label || "Field"} is required`
      }
      if (Array.isArray(value) && value.length === 0) {
        return `${config.label || "Field"} is required`
      }
    }

    // Skip other validations if field is empty and not required
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null
    }

    const validation = config.validation
    if (!validation) return null

    // Min length validation
    if (validation.min !== undefined) {
      if (typeof value === "string" && value.length < validation.min) {
        return `${config.label || "Field"} must be at least ${validation.min} characters`
      }
      if (Array.isArray(value) && value.length < validation.min) {
        return `${config.label || "Field"} must have at least ${validation.min} items`
      }
    }

    // Max length validation
    if (validation.max !== undefined) {
      if (typeof value === "string" && value.length > validation.max) {
        return `${config.label || "Field"} must be no more than ${validation.max} characters`
      }
      if (Array.isArray(value) && value.length > validation.max) {
        return `${config.label || "Field"} must have no more than ${validation.max} items`
      }
    }

    // Pattern validation
    if (validation.pattern && typeof value === "string") {
      if (!validation.pattern.test(value)) {
        return `${config.label || "Field"} format is invalid`
      }
    }

    // Custom validation
    if (validation.custom) {
      return validation.custom(value)
    }

    return null
  }

  static validateForm(fields: FormFieldConfig[], values: any): ValidationResult {
    const errors: { [key: string]: string } = {}
    let isValid = true

    fields.forEach((field) => {
      const error = this.validateField(field, values[field.id])
      if (error) {
        errors[field.id] = error
        isValid = false
      }
    })

    return { isValid, errors }
  }

  static validateRepeatableSection(
    fields: FormFieldConfig[],
    values: any[],
    minItems?: number,
    maxItems?: number,
  ): { isValid: boolean; errors: { [key: number]: { [key: string]: string }, _section?: string } } {
    const errors: { [key: number]: { [key: string]: string }, _section?: string } = {}
    let isValid = true

    if (minItems !== undefined && values.length < minItems) {
      errors._section = `At least ${minItems} items required`
      isValid = false
    }
    if (maxItems !== undefined && values.length > maxItems) {
      errors._section = `No more than ${maxItems} items allowed`
      isValid = false
    }

    values.forEach((item, index) => {
      fields.forEach((field) => {
        const error = this.validateField(field, item[field.id])
        if (error) {
          if (!errors[index]) errors[index] = {}
          errors[index][field.id] = error
          isValid = false
        }
      })
    })

    return { isValid, errors }
  }
}
