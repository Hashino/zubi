import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export function OSMMapView({ style, children, ...props }) {
  return (
    <View style={style}>
      <MapView
        style={StyleSheet.absoluteFill}
        urlTemplate={OSM_URL}
        {...props}
      >
        {children}
      </MapView>
    </View>
  );
}

export function OSMMarker({ coordinate, title, description, pinColor, onPress }) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      pinColor={pinColor}
      onPress={onPress}
    />
  );
}

export function OSMPolyline({ coordinates, strokeColor, strokeWidth }) {
  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor || '#4A90D9'}
      strokeWidth={strokeWidth || 4}
    />
  );
}

export default OSMMapView;
