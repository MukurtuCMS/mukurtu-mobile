import React from 'react';
import MapPicker from "react-native-map-picker";
import {View, Text, Button} from "react-native";
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';


export default class LocationComponent extends React.Component {
  // Location defaults to center of US if we cannot find a location
  state = {
    locationChecked: false,
    errorMessage: null
  };

  componentWillMount() {
    this._getLocationAsync();
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
        locationChecked: true
      });
    }

    let location = await Location.getCurrentPositionAsync({});
    this.props.setFormValue(this.props.fieldName, location.coords.latitude, location.coords.longitude);
    if (location) {
      this.setState({locationChecked: true});
    }
    this.forceUpdate();
  };

  render() {
    let lat = null;
    let long = null;
    if (this.props.formValues[this.props.fieldName]) {
      lat = this.props.formValues[this.props.fieldName]['und'][0]['geom']['lat'];
      long = this.props.formValues[this.props.fieldName]['und'][0]['geom']['lon'];
    }
    let text = [];
    let mapPicker = [];
    let setMyLocationButton = []
    if (this.state.errorMessage) {
      text = <Text>this.state.errorMessage</Text>;
    }
    else if (this.state.locationChecked) {
      setMyLocationButton = <Button title="Set My Location" onPress={this._getLocationAsync} />
      mapPicker = <MapPicker
        initialCoordinate={{
          latitude: (lat) ? lat : 37.09024,
          longitude: (long) ? long : -95.712891,
        }}
        onLocationSelect={({latitude, longitude})=> this.props.setFormValue(this.props.fieldName, latitude, longitude)}
      />
    }
    return(
        <View style={{flex: 1/2, height: 250}}>
          {text}
          {setMyLocationButton}
          {mapPicker}
        </View>
    );
  }
}
