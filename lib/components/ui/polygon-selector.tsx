import { Colors } from '@/lib/constants/Colors';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define Coordinate type locally if not found elsewhere
export type Coordinate = { latitude: number; longitude: number };

interface PolygonSelectorProps {
  existingAreas?: Coordinate[][];
  onAreaComplete?: (area: { coordinates: Coordinate[] }) => void;
  onChange?: (area: { coordinates: Coordinate[] }) => void;
  initialRegion?: Region;
  initialArea?: Coordinate[];
  isEditing?: boolean;
  label?: string;
  error?: string;
}

const PolygonSelector: React.FC<PolygonSelectorProps> = ({
  existingAreas = [],
  onAreaComplete,
  onChange,
  initialRegion,
  initialArea,
  isEditing = false,
  label,
  error,
}) => {
  const mapRef = useRef<MapView>(null);
  const editableMapRef = useRef<MapView>(null);
  const actionSheetRef = useRef<ActionSheetRef>(null);

  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 16.5062,
      longitude: 80.6480,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );

  const [editableRegion, setEditableRegion] = useState<Region>(region);
  const [drawingPoints, setDrawingPoints] = useState<Coordinate[]>(initialArea || []);
  const [tempDrawingPoints, setTempDrawingPoints] = useState<Coordinate[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasOverlap, setHasOverlap] = useState(false);
  const [isSelfIntersecting, setIsSelfIntersecting] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // Check for overlaps and self-intersection whenever temp points change
  useEffect(() => {
    if (tempDrawingPoints.length >= 3) {
      const overlaps = existingAreas.some(area => doPolygonsOverlap(tempDrawingPoints, area));
      setHasOverlap(overlaps);
      setIsSelfIntersecting(hasSelfIntersection(tempDrawingPoints));
    } else {
      setHasOverlap(false);
      setIsSelfIntersecting(false);
    }
  }, [tempDrawingPoints, existingAreas]);

  // Fit map to initial area if provided
  useEffect(() => {
    if (initialArea && initialArea.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(initialArea, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [initialArea]);

  useEffect(() => {
    if (hasValidPolygon && drawingPoints.length > 2 && mapRef.current) {
      mapRef.current.fitToCoordinates(drawingPoints, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      })
    }
  }, [drawingPoints])

  const handleEditableMapPress = (event: any) => {
    if (!isDrawing || isEditMode) return;

    const { coordinate } = event.nativeEvent;

    // Check if adding this point would create self-intersection
    if (tempDrawingPoints.length >= 2) {
      const newPoints = [...tempDrawingPoints, coordinate];
      if (wouldCreateSelfIntersection(newPoints)) {
        Alert.alert(
          'Invalid Point',
          'Adding this point would create a self-intersecting polygon. Please choose another location.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setTempDrawingPoints(prev => [...prev, coordinate]);
  };

  const handleMarkerDrag = (coordinate: Coordinate, index: number) => {
    const newPoints = [...tempDrawingPoints];
    newPoints[index] = coordinate;

    // Check if this would create self-intersection
    if (newPoints.length >= 3 && hasSelfIntersection(newPoints)) {
      Alert.alert(
        'Invalid Position',
        'Moving this point would create a self-intersecting polygon.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check for overlap with existing areas
    if (newPoints.length >= 3) {
      const overlaps = existingAreas.some(area => doPolygonsOverlap(newPoints, area));
      if (overlaps) {
        Alert.alert(
          'Area Overlap',
          'Moving this point would create an overlap with existing areas.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setTempDrawingPoints(newPoints);
  };

  const startDrawing = () => {
    setTempDrawingPoints(drawingPoints.length >= 3 ? [...drawingPoints] : []);
    setIsDrawing(true);
    setIsEditMode(false);
    setEditableRegion(region);

    // Add timeout to ensure state is set before showing
    setTimeout(() => {
      actionSheetRef.current?.show();
    }, 100);
  };

  const startEditing = () => {
    if (drawingPoints.length >= 3) {
      setTempDrawingPoints([...drawingPoints]);
      setIsEditMode(true);
      setIsDrawing(false);
      setEditableRegion(region);

      // Add timeout to ensure state is set before showing
      setTimeout(() => {
        actionSheetRef.current?.show();
      }, 100);
    }
  };

  const stopEditing = () => {
    setIsEditMode(false);
    setSelectedPointIndex(null);
  };

  const cancelDrawing = () => {
    setTempDrawingPoints([]);
    setIsDrawing(false);
    setIsEditMode(false);
    setSelectedPointIndex(null);
    actionSheetRef.current?.hide();
  };

  const completeDrawing = () => {
    if (tempDrawingPoints.length < 3) {
      Alert.alert('Invalid Area', 'Please add at least 3 points to create a valid area.', [{ text: 'OK' }]);
      return;
    }
    if (hasOverlap) {
      Alert.alert('Area Overlap', 'The drawn area overlaps with existing franchise areas. Please redraw.', [{ text: 'OK' }]);
      return;
    }
    if (isSelfIntersecting) {
      Alert.alert('Invalid Area', 'The polygon cannot intersect itself. Please redraw the area.', [{ text: 'OK' }]);
      return;
    }

    setDrawingPoints([...tempDrawingPoints]);
    if (typeof onAreaComplete === 'function') {
      onAreaComplete({ coordinates: tempDrawingPoints });
    }
    onChange?.({ coordinates: tempDrawingPoints });

    console.log(tempDrawingPoints)

    setIsDrawing(false);
    setIsEditMode(false);
    setTempDrawingPoints([]);
    actionSheetRef.current?.hide();
  };

  const removeLastPoint = () => {
    setTempDrawingPoints(prev => prev.slice(0, -1));
  };

  const removePoint = (index: number) => {
    if (tempDrawingPoints.length <= 3) {
      Alert.alert('Cannot Remove', 'A polygon must have at least 3 points.', [{ text: 'OK' }]);
      return;
    }
    setTempDrawingPoints(prev => prev.filter((_, i) => i !== index));
    setSelectedPointIndex(null);
  };

  // Improved polygon overlap check
  function doPolygonsOverlap(poly1: Coordinate[], poly2: Coordinate[]): boolean {
    if (poly1.length < 3 || poly2.length < 3) return false;

    // Check if any vertices of poly1 are inside poly2
    for (const point of poly1) {
      if (isPointInPolygon(point, poly2)) {
        return true;
      }
    }

    // Check if any vertices of poly2 are inside poly1
    for (const point of poly2) {
      if (isPointInPolygon(point, poly1)) {
        return true;
      }
    }

    // Check if any edges intersect
    for (let i = 0; i < poly1.length; i++) {
      const edge1Start = poly1[i];
      const edge1End = poly1[(i + 1) % poly1.length];

      for (let j = 0; j < poly2.length; j++) {
        const edge2Start = poly2[j];
        const edge2End = poly2[(j + 1) % poly2.length];

        if (doLineSegmentsIntersect(edge1Start, edge1End, edge2Start, edge2End)) {
          return true;
        }
      }
    }

    return false;
  }

  // Point-in-polygon (ray-casting algorithm)
  function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
    if (polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        (polygon[i].latitude > point.latitude) !== (polygon[j].latitude > point.latitude) &&
        point.longitude <
        ((polygon[j].longitude - polygon[i].longitude) * (point.latitude - polygon[i].latitude)) /
        (polygon[j].latitude - polygon[i].latitude) +
        polygon[i].longitude
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Self-intersection check
  function hasSelfIntersection(points: Coordinate[]): boolean {
    if (points.length < 4) return false;

    for (let i = 0; i < points.length; i++) {
      const a1 = points[i];
      const a2 = points[(i + 1) % points.length];

      for (let j = i + 2; j < points.length; j++) {
        // Skip adjacent edges and the closing edge
        if (j === i + 1 || (j + 1) % points.length === i) continue;

        const b1 = points[j];
        const b2 = points[(j + 1) % points.length];

        if (doLineSegmentsIntersect(a1, a2, b1, b2)) {
          return true;
        }
      }
    }
    return false;
  }

  function wouldCreateSelfIntersection(points: Coordinate[]): boolean {
    if (points.length < 4) return false;

    const lastIndex = points.length - 1;
    const newEdge = { p1: points[lastIndex - 1], p2: points[lastIndex] };

    // Check if the new edge intersects with any existing edges (except adjacent ones)
    for (let i = 0; i < points.length - 3; i++) {
      const edge = { p1: points[i], p2: points[i + 1] };
      if (doLineSegmentsIntersect(newEdge.p1, newEdge.p2, edge.p1, edge.p2)) {
        return true;
      }
    }

    // Check if closing the polygon would create intersection
    if (points.length >= 4) {
      const closingEdge = { p1: points[lastIndex], p2: points[0] };
      for (let i = 1; i < points.length - 2; i++) {
        const edge = { p1: points[i], p2: points[i + 1] };
        if (doLineSegmentsIntersect(closingEdge.p1, closingEdge.p2, edge.p1, edge.p2)) {
          return true;
        }
      }
    }

    return false;
  }

  function doLineSegmentsIntersect(
    p1: Coordinate,
    p2: Coordinate,
    p3: Coordinate,
    p4: Coordinate
  ): boolean {
    const d1 = direction(p3, p4, p1);
    const d2 = direction(p3, p4, p2);
    const d3 = direction(p1, p2, p3);
    const d4 = direction(p1, p2, p4);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }

    // Check for collinear cases
    if (d1 === 0 && isPointOnSegment(p3, p4, p1)) return true;
    if (d2 === 0 && isPointOnSegment(p3, p4, p2)) return true;
    if (d3 === 0 && isPointOnSegment(p1, p2, p3)) return true;
    if (d4 === 0 && isPointOnSegment(p1, p2, p4)) return true;

    return false;
  }

  function direction(p1: Coordinate, p2: Coordinate, p3: Coordinate): number {
    return (p3.longitude - p1.longitude) * (p2.latitude - p1.latitude) -
      (p2.longitude - p1.longitude) * (p3.latitude - p1.latitude);
  }

  function isPointOnSegment(p1: Coordinate, p2: Coordinate, p: Coordinate): boolean {
    return (
      p.longitude <= Math.max(p1.longitude, p2.longitude) &&
      p.longitude >= Math.min(p1.longitude, p2.longitude) &&
      p.latitude <= Math.max(p1.latitude, p2.latitude) &&
      p.latitude >= Math.min(p1.latitude, p2.latitude)
    );
  }

  const hasValidPolygon = drawingPoints.length >= 3;
  const hasValidTempPolygon = tempDrawingPoints.length >= 3;
  const canComplete = hasValidTempPolygon && !hasOverlap && !isSelfIntersecting;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Static Map Display */}
      <View style={{ ...styles.mapWrapper, borderWidth: 1, borderColor: error ? 'red' : 'transparent' }}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {/* Existing franchise areas */}
          {existingAreas.map((area, index) => (
            <Polygon
              key={`existing-${index}`}
              coordinates={area}
              strokeWidth={2}
              strokeColor={Colors.light.tabIconDefault}
              fillColor={Colors.light.background + '80'}
            />
          ))}

          {/* Currently saved polygon */}
          {hasValidPolygon && (
            <Polygon
              coordinates={drawingPoints}
              strokeWidth={2}
              strokeColor={Colors.light.tint}
              fillColor={Colors.light.tint + '30'}
            />
          )}

          {/* Static markers for saved polygon */}
          {drawingPoints.map((point, index) => (
            <Marker
              key={`static-point-${index}`}
              coordinate={point}
              pinColor={index === 0 ? 'green' : 'red'}
            />
          ))}
        </MapView>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {!hasValidPolygon && (
          <TouchableOpacity style={styles.startButton} onPress={startDrawing}>
            <Text style={styles.buttonText}>Start Drawing Area</Text>
          </TouchableOpacity>
        )}

        {hasValidPolygon && (
          <View style={styles.drawingControls}>
            <TouchableOpacity style={[styles.controlButton, styles.editButton]} onPress={startEditing}>
              <Text style={styles.controlButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.controlButton, styles.redrawButton]} onPress={startDrawing}>
              <Text style={styles.controlButtonText}>Redraw</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* ActionSheet for Drawing/Editing */}
      <ActionSheet
        ref={actionSheetRef}
        containerStyle={styles.actionSheetContainer}
        gestureEnabled={false}
        closeOnTouchBackdrop={false}
        drawUnderStatusBar={false}
        defaultOverlayOpacity={0.3}
      >
        <View style={styles.actionSheetContent}>
          <View style={styles.actionSheetHeader}>
            <Text style={styles.actionSheetTitle}>
              {isEditMode ? 'Edit Area' : 'Draw New Area'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={cancelDrawing}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Editable Map */}
          <View style={styles.editableMapWrapper}>
            <MapView
              ref={editableMapRef}
              style={styles.editableMap}
              provider={PROVIDER_GOOGLE}
              initialRegion={editableRegion}
              onRegionChangeComplete={setEditableRegion}
              onPress={handleEditableMapPress}
            >
              {/* Existing franchise areas */}
              {existingAreas.map((area, index) => (
                <Polygon
                  key={`editable-existing-${index}`}
                  coordinates={area}
                  strokeWidth={2}
                  strokeColor={Colors.light.tabIconDefault}
                  fillColor={Colors.light.background + '80'}
                />
              ))}

              {/* Currently drawing/editing polygon */}
              {hasValidTempPolygon && (
                <Polygon
                  coordinates={tempDrawingPoints}
                  strokeWidth={2}
                  strokeColor={
                    isSelfIntersecting
                      ? '#ef4444'
                      : hasOverlap
                        ? '#f59e42'
                        : Colors.light.tint
                  }
                  fillColor={
                    isSelfIntersecting
                      ? 'rgba(244, 67, 54, 0.3)'
                      : hasOverlap
                        ? 'rgba(245, 158, 66, 0.3)'
                        : Colors.light.tint + '30'
                  }
                />
              )}

              {/* Drawing/editing points */}
              {tempDrawingPoints.map((point, index) => (
                <Marker
                  key={`editable-point-${index}`}
                  coordinate={point}
                  pinColor={index === 0 ? 'green' : selectedPointIndex === index ? 'blue' : 'red'}
                  title={`Point ${index + 1}`}
                  draggable={isEditMode}
                  onDragEnd={(e) => handleMarkerDrag(e.nativeEvent.coordinate, index)}
                  onPress={() => {
                    if (isEditMode) {
                      setSelectedPointIndex(selectedPointIndex === index ? null : index);
                    }
                  }}
                />
              ))}
            </MapView>
          </View>

          {/* ActionSheet Controls */}
          <View style={styles.actionSheetControls}>
            {isDrawing && (
              <View style={styles.drawingControls}>
                <TouchableOpacity style={[styles.controlButton, styles.cancelButton]} onPress={cancelDrawing}>
                  <Text style={styles.controlButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.undoButton]}
                  onPress={removeLastPoint}
                  disabled={tempDrawingPoints.length === 0}
                >
                  <Text style={styles.controlButtonText}>Undo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    styles.completeButton,
                    !canComplete && styles.disabledButton,
                  ]}
                  onPress={completeDrawing}
                  disabled={!canComplete}
                >
                  <Text style={styles.controlButtonText}>Complete</Text>
                </TouchableOpacity>
              </View>
            )}

            {isEditMode && (
              <View style={styles.drawingControls}>
                <TouchableOpacity style={[styles.controlButton, styles.cancelButton]} onPress={cancelDrawing}>
                  <Text style={styles.controlButtonText}>Cancel</Text>
                </TouchableOpacity>
                {selectedPointIndex !== null && (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.deleteButton]}
                    onPress={() => removePoint(selectedPointIndex)}
                  >
                    <Text style={styles.controlButtonText}>Remove Point</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    styles.completeButton,
                    !canComplete && styles.disabledButton,
                  ]}
                  onPress={completeDrawing}
                  disabled={!canComplete}
                >
                  <Text style={styles.controlButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Status indicator */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isEditMode
                ? selectedPointIndex !== null
                  ? 'Drag to move point or tap "Remove Point" to delete it'
                  : 'Tap a point to select it, then drag to move or remove it'
                : tempDrawingPoints.length === 0
                  ? 'Tap on the map to start drawing'
                  : tempDrawingPoints.length < 3
                    ? `Points: ${tempDrawingPoints.length} (need at least 3)`
                    : isSelfIntersecting
                      ? 'Error: Polygon lines are crossing each other'
                      : hasOverlap
                        ? 'Warning: Area overlaps with existing areas'
                        : 'Valid area - tap Complete when finished'}
            </Text>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  mapWrapper: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  startButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  drawingControls: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  controlButton: {
    backgroundColor: Colors.light.tabIconDefault,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  undoButton: {
    backgroundColor: '#6b7280',
  },
  completeButton: {
    backgroundColor: '#22c55e',
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  redrawButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  // ActionSheet Styles
  actionSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: screenHeight * 0.8,
  },
  actionSheetContent: {
    flex: 1,
    padding: 16,
    minHeight: screenHeight * 0.75,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  editableMapWrapper: {
    width: '100%',
    height: screenHeight * 0.4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editableMap: {
    width: '100%',
    height: '100%',
  },
  actionSheetControls: {
    marginBottom: 16,
  },
  statusContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default PolygonSelector;