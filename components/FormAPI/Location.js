import React from 'react';
import {
  View,
  Text,
  Button,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput
} from "react-native";
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import MapView, {Marker} from "react-native-maps";
import _ from 'lodash';
import Colors from "../../constants/Colors";


export default class LocationComponent extends React.Component {
  // Location defaults to center of US if we cannot find a location
  constructor(props) {
    super(props);
    this.state = {
      locationChecked: false,
      errorMessage: null,
      updateIndex: 0,
      lookingUp: false
    };

    this._getLocationAsync = this._getLocationAsync.bind(this);
    this._mounted = false;
  }


  componentDidMount() {
    this._mounted = true;
  }

  componentWillUnmount() {
    this._mounted = false;
  }


  getPropsLocation = () => {
    const {formValues, fieldName} = this.props;
    if (_.has(formValues, [fieldName, 'und', 0, 'lat'])) {
      return {
        latitude: Number(_.get(formValues, [fieldName, 'und', 0, 'lat'], 0)),
        longitude: Number(_.get(formValues, [fieldName, 'und', 0, 'lon'], 0))
      }
    }

    return {
      latitude: Number(_.get(formValues, [fieldName, 'und', 0, 'geom', 'lat'], 0)),
      longitude: Number(_.get(formValues, [fieldName, 'und', 0, 'geom', 'lon'], 0))
    }
  }

  setLocation = (latLng) => {
    const {setFormValue, fieldName} = this.props;
    setFormValue(fieldName, latLng.latitude, latLng.longitude);
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this._mounted && this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
    else {
      try {
        let location = await Location.getCurrentPositionAsync({});
        if (location) {
          this.props.setFormValue(this.props.fieldName, location.coords.latitude, location.coords.longitude);
        }
      }
      catch (e) {
        console.log('Could not get location', e);
        this._mounted && this.setState({
          errorMessage: 'Not able to determine location',
        });
      }
    }
  };

  manualAdjust = (type, value) => {
    const latLng = this.getPropsLocation();
    if (type === 'latitude') {
      latLng.latitude = Number(value);
    }
    else {
      latLng.longitude = Number(value);
    }

    this.setLocation(latLng);
  }

  render() {
    let text = null;

    if (this.state.errorMessage) {
      text = <Text>{this.state.errorMessage}</Text>;
    }

    const setMyLocationButton = (
      <TouchableOpacity
        style={styles.mediaButton}
        disabled={this.state.lookingUp}
        onPress={() => {
          this.setState({lookingUp: true})
          this._getLocationAsync().then(() => {
            this.setState({lookingUp: false})
          })
        }}>
        <Text style={styles.mediaButtonText}>Set My Location</Text>
      </TouchableOpacity>
    );

    const latLng = this.getPropsLocation();

    const mapView = (
      <MapView
        style={{width: Dimensions.get('window').width - 20,
          height: 300,
          marginBottom: 10,
          marginTop: 18}}
        region={{
          latitude: latLng.latitude === 0 ? 37.09024 : latLng.latitude,
          longitude: latLng.longitude === 0 ? -95.712891 : latLng.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {latLng.longitude !== 0 && <Marker
          coordinate={latLng}
          draggable={true}
          onDragEnd={e => {
            this.setLocation(e.nativeEvent.coordinate)
          }}
        />}
      </MapView>
    );

    return (
      <View style={{ marginBottom: 10}}>
        {text}
        <FieldDescription
          description={(this.props.description) ? this.props.description : null}/>
        <Required required={this.props.required}/>
        <View>
          {setMyLocationButton}
          {this.state.lookingUp && <ActivityIndicator size="small" color={Colors.primary}/>}
        </View>
        {mapView}
        <View>
          <Text style={styles.label}>Latitude:</Text>
          <TextInput
            keyboardType={'decimal-pad'}
            autoCapitalize={'none'}
            autoCompleteType={'off'}
            autoCorrect={false}
            style={styles.input}
            value={latLng.latitude.toString()}
            onChangeText={(text) => this.manualAdjust('latitude', text)}
          />
        </View>
        <View>
          <Text style={styles.label}>Longitude:</Text>
          <TextInput
            keyboardType={'decimal-pad'}
            autoCapitalize={'none'}
            autoCompleteType={'off'}
            autoCorrect={false}
            style={styles.input}
            value={latLng.longitude.toString()}
            onChangeText={(text) => this.manualAdjust('longitude', text)}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mediaButton: {
    color: Colors.primary,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 3,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'center',
    width: '100%',
  },
  mediaButtonText: {
    color: Colors.primary,
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  label: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    fontSize: 16
  }
});
