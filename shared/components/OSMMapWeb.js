import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const OSM_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-control-zoom { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([-23.5505, -46.6333], 15);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);
    
    var originMarker = null;
    var destMarker = null;
    var routeLine = null;
    
    window.setOrigin = function(lat, lng, title) {
      if (originMarker) map.removeLayer(originMarker);
      originMarker = L.marker([lat, lng], { icon: L.divIcon({ className: 'origin-marker', html: '🔵', iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(map).bindPopup(title || 'Origem');
      if (destMarker && originMarker) {
        fitBounds();
      } else {
        map.setView([lat, lng], 15);
      }
    };
    
    window.setDestination = function(lat, lng, title) {
      if (destMarker) map.removeLayer(destMarker);
      destMarker = L.marker([lat, lng], { icon: L.divIcon({ className: 'dest-marker', html: '🔴', iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(map).bindPopup(title || 'Destino');
      if (originMarker) fitBounds();
    };
    
    function fitBounds() {
      if (originMarker && destMarker) {
        var group = new L.featureGroup([originMarker, destMarker]);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
    
    window.setView = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || 15);
    };
    
    window.onload = function() {
      window.reactNativeReady = true;
    };
  </script>
</body>
</html>
`;

const OSMMap = forwardRef(function OSMMap({ 
  style, 
  origin, 
  destination, 
  onOriginChange, 
  onDestinationChange 
}, ref) {
  const webViewRef = useRef(null);
  
  useImperativeHandle(ref, () => ({
    setOrigin: (lat, lng) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `setOrigin(${lat}, ${lng}, 'Origem'); true;`
        );
      }
    },
    setDestination: (lat, lng) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `setDestination(${lat}, ${lng}, 'Destino'); true;`
        );
      }
    },
    setView: (lat, lng, zoom) => {
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `setView(${lat}, ${lng}, ${zoom || 15}); true;`
        );
      }
    }
  }));

  useEffect(() => {
    if (origin && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `setOrigin(${origin.latitude}, ${origin.longitude}, 'Origem'); true;`
      );
    }
  }, [origin]);

  useEffect(() => {
    if (destination && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `setDestination(${destination.latitude}, ${destination.longitude}, 'Destino'); true;`
      );
    }
  }, [destination]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick' && onDestinationChange) {
        onDestinationChange({
          latitude: data.lat,
          longitude: data.lng,
          address: 'Selecionado no mapa'
        });
      }
    } catch (e) {
      console.log('Map message:', event.nativeEvent.data);
    }
  };

  return (
    <View style={style}>
      <WebView
        ref={webViewRef}
        source={{ html: OSM_HTML }}
        style={styles.map}
        scrollEnabled={false}
        zoomEnabled={true}
        showsZoomControls={false}
        showsLocationButton={false}
        onMessage={handleMessage}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
