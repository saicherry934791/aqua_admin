import { Star } from "lucide-react-native"
import React from "react"
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { DynamicForm, type FormSection } from "../../components/dynamic-form/dynamic-form"
import { PolygonSelector } from "../../components/ui/polygon-selector"

// Custom rating component example
const RatingComponent = ({ label, value, onChange, error }: any) => {
  const handlePress = () => {
    const options = ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars", "Cancel"]

    Alert.alert(
      "Select Rating",
      "",
      [
        { text: options[0], onPress: () => onChange(1) },
        { text: options[1], onPress: () => onChange(2) },
        { text: options[2], onPress: () => onChange(3) },
        { text: options[3], onPress: () => onChange(4) },
        { text: options[4], onPress: () => onChange(5) },
        { text: options[5], style: "cancel" },
      ],
      { cancelable: true }
    )
  }

  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 6, fontFamily: 'PlusJakartaSans_600SemiBold' }}>{label}</Text>}
      <TouchableOpacity
        onPress={handlePress}
        style={{
          backgroundColor: "#f4f4f5",
          borderColor: error ? "#ef4444" : "#e4e4e7",
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', color: value ? "#18181b" : "#71717a" }}>
          {value ? (
            <>
              <Star size={16} color="#FFD700" fill="#FFD700" /> {value} ({value}/5)
            </>
          ) : (
            "Select Rating"
          )}
        </Text>
        <Star size={16} color="#71717a" />
      </TouchableOpacity>
      {error && <Text style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontFamily: 'PlusJakartaSans_400Regular' }}>{error}</Text>}
    </View>
  )
}

const formSections: FormSection[] = [
  {
    id: "basic_info",
    title: "Basic Information",
    fields: [
      {
        id: "name",
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
        validation: {
          min: 2,
          max: 50,
        },
      },
      {
        id: "email",
        type: "text",
        label: "Email",
        placeholder: "Enter your email",
        required: true,
        validation: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          custom: (value: string) => {
            if (value && !value.includes("@")) {
              return "Please enter a valid email address"
            }
            return null
          },
        },
      },
      {
        id: "description",
        type: "textarea",
        label: "Description",
        placeholder: "Tell us about yourself",
        required: true,
        props: { rows: 4 },
        validation: {
          max: 500,
          min: 100
        },
      },
      {
        id: "category",
        type: "select",
        label: "Category",
        placeholder: "Select a category",
        required: true,
        options: [
          { label: "Business", value: "business" },
          { label: "Personal", value: "personal" },
          { label: "Other", value: "other" },
        ],
      },
      {
        id: "skills",
        type: "multiselect",
        label: "Skills",
        placeholder: "Select your skills",
        required: true,
        options: [
          { label: "React Native", value: "react-native" },
          { label: "JavaScript", value: "javascript" },
          { label: "TypeScript", value: "typescript" },
          { label: "Node.js", value: "nodejs" },
          { label: "React.js", value: "reactjs" },
          { label: "Vue.js", value: "vuejs" },
          { label: "Angular", value: "angular" },
          { label: "Next.js", value: "nextjs" },
          { label: "Express.js", value: "expressjs" },
          { label: "Python", value: "python" },
          { label: "Django", value: "django" },
          { label: "Flask", value: "flask" },
          { label: "FastAPI", value: "fastapi" },
          { label: "Java", value: "java" },
          { label: "Kotlin", value: "kotlin" },
          { label: "Swift", value: "swift" },
          { label: "Firebase", value: "firebase" },
          { label: "MongoDB", value: "mongodb" },
          { label: "MySQL", value: "mysql" },
          { label: "PostgreSQL", value: "postgresql" },
          { label: "GraphQL", value: "graphql" },
          { label: "Tailwind CSS", value: "tailwind" },
          { label: "Sass", value: "sass" },
          { label: "Docker", value: "docker" },
          { label: "Kubernetes", value: "kubernetes" },
          { label: "AWS", value: "aws" },
          { label: "Git", value: "git" }
        ]
        ,

      },
      {
        id: "profile_images",
        type: "image",
        label: "Profile Images",
        props: { multiple: true },
        required: true,
        validation: {
          min: 2
        }
      },
      {
        id: "rating",
        type: "custom",
        label: "Service Rating",
        customComponent: RatingComponent,
        required: true,
        validation: {
          custom: (value: number) => {
            if (value && (value < 1 || value > 5)) {
              return "Rating must be between 1 and 5"
            }
            return null
          },
        },
      },
    ],
  },
  {
    id: "service_area",
    title: "Service Area",
    fields: [
      {
        id: "polygon",
        type: "custom",
        label: "Service Area Polygon",
        placeholder: "Select your service area",
        customComponent: PolygonSelector,
        required: true,
        validation: {
          custom: (value: any) => {
            if (value && (!value.coordinates || value.coordinates.length < 3)) {
              return "Service area must have at least 3 coordinate points"
            }
            return null
          },
        },
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & Quantity",
    repeatable: {
      fields: [
        {
          id: "item_name",
          type: "text",
          label: "Item Name",
          placeholder: "Enter item name",
          required: true,
          validation: {
            min: 2,
            max: 100,
          },
        },
        {
          id: "quantity",
          type: "text",
          label: "Quantity",
          placeholder: "Enter quantity",
          required: true,
          validation: {
            pattern: /^\d+$/,
            custom: (value: string) => {
              const num = Number.parseInt(value)
              if (isNaN(num) || num <= 0) {
                return "Quantity must be a positive number"
              }
              if (num > 1000) {
                return "Quantity cannot exceed 1000"
              }
              return null
            },
          },
        },
        {
          id: "price",
          type: "text",
          label: "Price ($)",
          placeholder: "Enter price",
          required: true,
          validation: {
            pattern: /^\d+(\.\d{2})?$/,
            custom: (value: string) => {
              const num = Number.parseFloat(value)
              if (isNaN(num) || num <= 0) {
                return "Price must be a positive number"
              }
              if (num > 10000) {
                return "Price cannot exceed $10,000"
              }
              return null
            },
          },
        },
        {
          id: "item_images",
          type: "image",
          label: "Item Images",
          props: { multiple: true },
        },
      ],
      minItems: 1,
      maxItems: 5,
    },
  },
]

export default function App() {
  const handleSubmit = async (values: any) => {
    console.log("Form submitted with values:", JSON.stringify(values, null, 2))

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate random success/failure for demo
    if (Math.random() > 0.3) {
      console.log("✅ Form submission successful!")
    } else {
      throw new Error("Simulated server error")
    }
  }

  const handleSuccess = (values: any) => {
    console.log("🎉 Form submission successful:", values)
  }

  const handleError = (error: Error) => {
    console.error("❌ Form submission failed:", error.message)
  }

  return (

    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <DynamicForm
          sections={formSections}
          onSubmit={handleSubmit}
          onSuccess={handleSuccess}
          onError={handleError}
          submitButtonText="Create Profile"
          initialValues={{
            basic_info: {
              name: 'sai'
            }
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
})
