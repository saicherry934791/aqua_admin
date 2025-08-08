import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ServiceRequestStatus, ServiceType } from '../types/ServiceRequest';

interface ServiceImageManagerProps {
  serviceType: ServiceType;
  currentStatus: ServiceRequestStatus;
  initialImages: string[];
  beforeImages: string[];
  afterImages: string[];
  onBeforeImagesChange: (images: string[]) => void;
  onAfterImagesChange: (images: string[]) => void;
  onViewImages: (images: string[], startIndex: number) => void;
}

export const ServiceImageManager: React.FC<ServiceImageManagerProps> = ({
  serviceType,
  currentStatus,
  initialImages,
  beforeImages,
  afterImages,
  onBeforeImagesChange,
  onAfterImagesChange,
  onViewImages,
}) => {
  const pickImages = async (type: 'before' | 'after') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);

        if (type === 'before') {
          onBeforeImagesChange([...beforeImages, ...newImages]);
        } else {
          onAfterImagesChange([...afterImages, ...newImages]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const removeImage = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      onBeforeImagesChange(beforeImages.filter((_, i) => i !== index));
    } else {
      onAfterImagesChange(afterImages.filter((_, i) => i !== index));
    }
  };

  const canAddBeforeImages = () => {
    return currentStatus === ServiceRequestStatus.SCHEDULED ||
      currentStatus === ServiceRequestStatus.ASSIGNED;
  };

  const canAddAfterImages = () => {
    return currentStatus === ServiceRequestStatus.IN_PROGRESS;
  };

  const requiresBeforeImages = () => {
    return (currentStatus === ServiceRequestStatus.SCHEDULED || currentStatus === ServiceRequestStatus.IN_PROGRESS);
  };

  const requiresAfterImages = () => {
    return currentStatus === ServiceRequestStatus.IN_PROGRESS;
  };

  const renderImageGrid = (images: string[], type: 'initial' | 'before' | 'after') => {
    const canRemove = (type === 'before' && canAddBeforeImages()) ||
      (type === 'after' && canAddAfterImages());

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.imageGrid}>
          {images.map((imageUri, index) => (
            <View key={index} style={styles.imageContainer}>
              <TouchableOpacity onPress={() => onViewImages(images, index)}>
                <Image source={{ uri: imageUri }} style={styles.serviceImage} />
              </TouchableOpacity>
              {canRemove && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(type as 'before' | 'after', index)}
                >
                  <Ionicons name="close" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderEmptyState = (type: 'before' | 'after', onPress: () => void, required: boolean) => {
    const isBeforeType = type === 'before';
    const title = required
      ? `${isBeforeType ? 'Before' : 'After'} images required`
      : `Add ${isBeforeType ? 'before' : 'after'} images`;

    const subtitle = isBeforeType
      ? 'Take photos before starting the service'
      : 'Take photos after completing the service';

    return (
      <View style={[styles.noImagesContainer, required && styles.requiredImagesContainer]}>
        <Ionicons
          name="camera"
          size={32}
          color={required ? '#EF4444' : '#9CA3AF'}
        />
        <Text style={[styles.noImagesTitle, required && styles.requiredImagesTitle]}>
          {title}
        </Text>
        <Text style={styles.noImagesSubtitle}>
          {subtitle}
        </Text>
        <TouchableOpacity
          style={[styles.addFirstImageButton, required && styles.requiredImageButton]}
          onPress={onPress}
        >
          <Ionicons name="camera" size={16} color="#FFFFFF" />
          <Text style={styles.addFirstImageText}>
            Add {isBeforeType ? 'Before' : 'After'} Photos
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.cardTitle}>Service Images</Text>

      {/* Initial Images */}
      {initialImages && initialImages.length > 0 && (
        <View style={styles.imageSection}>
          <Text style={styles.imageSectionTitle}>Initial Images</Text>
          {renderImageGrid(initialImages, 'initial')}
        </View>
      )}

      {/* Before Images */}
      {(requiresBeforeImages() || beforeImages.length > 0) && (
        <View style={styles.imageSection}>
          <View style={styles.imageSectionHeader}>
            <Text style={[
              styles.imageSectionTitle,
              requiresBeforeImages() && beforeImages.length === 0 && styles.requiredSectionTitle
            ]}>
              Before Service {requiresBeforeImages() && beforeImages.length === 0 && '*'}
            </Text>
            {canAddBeforeImages() && beforeImages.length > 0 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={() => pickImages('before')}
              >
                <Ionicons name="camera" size={16} color="#3B82F6" />
                <Text style={styles.addImageText}>Add More</Text>
              </TouchableOpacity>
            )}
          </View>

          {beforeImages.length > 0 ? (
            renderImageGrid(beforeImages, 'before')
          ) : canAddBeforeImages() ? (
            renderEmptyState('before', () => pickImages('before'), requiresBeforeImages())
          ) : null}
        </View>
      )}

      {/* After Images */}
      {(currentStatus === ServiceRequestStatus.IN_PROGRESS ||
        currentStatus === ServiceRequestStatus.PAYMENT_PENDING ||
        currentStatus === ServiceRequestStatus.COMPLETED ||
        afterImages.length > 0) && (
          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Text style={[
                styles.imageSectionTitle,
                requiresAfterImages() && afterImages.length === 0 && styles.requiredSectionTitle
              ]}>
                After Service {requiresAfterImages() && afterImages.length === 0 && '*'}
              </Text>
              {canAddAfterImages() && afterImages.length > 0 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => pickImages('after')}
                >
                  <Ionicons name="camera" size={16} color="#3B82F6" />
                  <Text style={styles.addImageText}>Add More</Text>
                </TouchableOpacity>
              )}
            </View>

            {afterImages.length > 0 ? (
              renderImageGrid(afterImages, 'after')
            ) : canAddAfterImages() ? (
              renderEmptyState('after', () => pickImages('after'), requiresAfterImages())
            ) : null}
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#374151',
  },
  requiredSectionTitle: {
    color: '#EF4444',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addImageText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#3B82F6',
    marginLeft: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  requiredImagesContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  noImagesTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#6B7280',
    marginTop: 8,
  },
  requiredImagesTitle: {
    color: '#EF4444',
  },
  noImagesSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
  },
  addFirstImageButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredImageButton: {
    backgroundColor: '#EF4444',
  },
  addFirstImageText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});