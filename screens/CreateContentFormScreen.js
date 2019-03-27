import React from 'react';
import ContentTypes from '../endpoints/ContentTypes';
import {
  AppRegistry,
  ScrollView,
  Component,
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
  TouchableHighlight,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import { connect } from 'react-redux';
import { addPlace } from '../actions/place';
import { addUser } from '../actions/user';
import transform from 'tcomb-json-schema';
import t from 'tcomb-form-native';
import ImageFactory from 'react-native-image-picker-form';
import DigitalHeritageForm from '../endpoints/DigitalHeritage';
import { FileSystem } from 'expo';

class CreateContentFormScreen extends React.Component {
  static navigationOptions = {
    title: 'Create Article',
  };

  constructor(){
    super();
    this.state = {switchValue: false, loggedIn: false, token: false, user: {}, places: '', placeName: ''};
    this.onPress = this.onPress.bind(this);
  }

  componentDidMount(){
    this.props.navigation.addListener('willFocus', this.componentActive)
  }

  componentActive(){
  }

  onPress = async () => {
    var value = this.refs.form.getValue();
    console.warn(value.File);
    // console.log(value);
    console.log(value);
    if (value) { // if validation fails, value will be null
      let fileObject = {};
      try {
        /*      const info = await FileSystem.getInfoAsync(result.uri);
         // this.setState({ data: info });
         console.warn('info', info);*/
        const content = await FileSystem.readAsStringAsync(value.File, {
          encoding: FileSystem.EncodingTypes.Base64,
        });
        console.log(content);
        fileObject.blob = content;
        // this.setState({ data: content });
      } catch (e) {
        console.warn(e.message);
      }
      this.setState({value: fileObject});
    }
  }

  render() {

    var FormMarkup = [];
    var Form = t.form.Form;
    for (var i = 0; i < DigitalHeritageForm.length; i++) {
      var TcombType = transform(DigitalHeritageForm[i]['form']);
      var options = DigitalHeritageForm[i]['options'];
      FormMarkup.push(
        <Form
          key={i}
          ref="form"
          type={TcombType}
          options={options}
        />
      );
    }

    return (
      <View style={{backgroundColor:'#EFEFF4',flex:1, padding: '5%'}}>
        <ScrollView style={{backgroundColor:'#EFEFF4',flex:1}}>
          {FormMarkup}
          <TouchableHighlight style={styles.button} onPress={this.onPress} underlayColor='#99d9f4'>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableHighlight>
        </ScrollView>
      </View>

    );
  }
}

var styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    marginTop: 50,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    alignSelf: 'center'
  },
  button: {
    height: 36,
    backgroundColor: '#48BBEC',
    borderColor: '#48BBEC',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'stretch',
    justifyContent: 'center'
  }
});

const mapStateToProps = state => {
  return {
    places: state.places.places,
    user: state.user.user
  }
}

const mapDispatchToProps = dispatch => {
  return {
    add: (name) => {
      dispatch(addPlace(name))
    },
    addUserProp: (name) => {
      dispatch(addUser(name))
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateContentFormScreen)
