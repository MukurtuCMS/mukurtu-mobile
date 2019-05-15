import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Constants, MapView } from 'expo';

import {
  Text,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';

const screen = Dimensions.get('window');

const ASPECT_RATIO = screen.width / screen.height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default class Location extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      coordinate: new MapView.AnimatedRegion({
        latitude: LATITUDE,
        longitude: LONGITUDE,
      }),
    };
  }

  animate(newCoordinate) {
    const duration = 0

    if (Platform.OS === 'android') {
      if (this.marker) {
        this.marker._component.animateMarkerToCoordinate(
          newCoordinate,
          duration
        );
      }
    } else {
      this.state.coordinate.timing({
        ...newCoordinate,
        duration
      }).start();
    }

  }

  _handleMapRegionChange = mapRegion => {
    this.animate(mapRegion)
  };

  render() {
    return (
      <View style={styles.container}>
          <MapView
            provider={this.props.provider}
            style={styles.map}
            initialRegion={{
              latitude: LATITUDE,
              longitude: LONGITUDE,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }}
            onRegionChange={this._handleMapRegionChange}
          >
              <MapView.Marker.Animated
                ref={marker => { this.marker = marker; }}
                coordinate={this.state.coordinate}
              />
          </MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
  },
  latlng: {
    width: 200,
    alignItems: 'stretch',
  },
  button: {
    width: 80,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    backgroundColor: 'transparent',
  },
});
