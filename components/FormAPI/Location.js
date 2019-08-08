import React from 'react';
import MapPicker from "react-native-map-picker";
import {View, Text, Button} from "react-native";
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import FieldDescription from "./FieldDescription";
import Required from "./Required";


export default class LocationComponent extends React.Component {
  // Location defaults to center of US if we cannot find a location
  constructor(props) {
    super(props);
    this.state = {
      locationChecked: false,
      errorMessage: null,
      updateIndex: 0
    };

    this._getLocationAsync = this._getLocationAsync.bind(this);
  }


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
      this.setState({
        locationChecked: true,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        updateIndex: this.state.updateIndex + 1
      });
    }
    this.forceUpdate();
  };

  render() {
    let lat = null;
    let long = null;
    if(this.state.longitude) {
      lat = this.state.latitude;
      long = this.state.longitude
    } else if (this.props.formValues[this.props.fieldName]) {
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
        updateIndex={this.state.updateIndex}
      />
    }
    return(
        <View style={{flex: 1/2, height: 250}}>
          {text}
          <FieldDescription description={(this.props.description) ? this.props.description : null} />
          <Required required={this.props.required}/>
          {setMyLocationButton}
          {mapPicker}
        </View>
    );
  }
}
