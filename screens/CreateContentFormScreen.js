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
  TouchableHighlight, NetInfo,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import {connect} from 'react-redux';
import {addPlace} from '../actions/place';
import {addUser} from '../actions/user';
import transform from 'tcomb-json-schema';
import t from 'tcomb-form-native';
import ImageFactory from 'react-native-image-picker-form';
import DigitalHeritageForm from '../endpoints/DigitalHeritage';
import {FileSystem} from 'expo';
import * as SQLite from 'expo-sqlite';
import FormComponent from '../components/FormAPI/Form';
import weightSort from 'weight-sort';
import * as Colors from "../constants/Colors";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

class CreateContentFormScreen extends React.Component {
  static navigationOptions = ({navigation}) => (
    {
    title: `${navigation.getParam('editWord')}` + ' ' + `${navigation.getParam('contentTypeLabel')}`,
    headerStyle: {
      backgroundColor: Colors.default.gold,
      marginTop: -20,
      headerTintColor: '#000',
    },
    headerTintColor: '#000',
  });

  constructor(props) {
    super(props);
    const { navigation, screenProps } = this.props;
    this.state = {switchValue: false, loggedIn: false, token: false, user: {}, places: '', placeName: '', form: [], oldForm: '', db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null};
    this.onPress = this.onPress.bind(this);
  }

  componentDidMount() {
    this.props.navigation.addListener('willFocus', this.componentActive)

  }


  componentActive = () => {
  }


  onPress = async () => {
    var value = this.refs.form.getValue();
    // console.log(value);
    if (value) { // if validation fails, value will be null
      let fileObject = {};
      try {
        /*      const info = await FileSystem.getInfoAsync(result.uri);
         // this.setState({ data: info });
         console.warn('info', info);*/
        const content = await FileSystem.readAsStringAsync(value.File, {
          encoding: FileSystem.EncodingTypes.Base64,
        });
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
    const contentType = this.props.navigation.getParam('contentType');
    let propsForm = this.props.screenProps.formFields[contentType];
    for (var i = 0; i < DigitalHeritageForm.length; i++) {
      var TcombType = transform(DigitalHeritageForm[i]['form']);
      var options = DigitalHeritageForm[i]['options'];
      FormMarkup.push(
        <Form
          key={i}
          ref="form"
          type={TcombType}
          options={options}
          screenProps={this.props.screenProps}
        />
      );
    }

    let nodeForm = [];


    const formObject = Object.entries(propsForm).length;
    if (formObject > 0) {

      // we need to order the form by groups and fields
      let sortedNodeForm = [];
      let sortGroups = [];

      if (propsForm['#groups'].length === 0) {
        sortedNodeForm = Object.values(propsForm);
      } else {
        let groups = propsForm['#groups']['group_tabs'].children;
        for (var i = 0; i < groups.length; i++) {
          var group = groups[i];
          sortGroups.push({'name': group, 'weight': propsForm['#groups'][group]['weight']});
        }
        sortGroups = weightSort(sortGroups);
        for (var i = 0; i < sortGroups.length; i++) {
          var group = sortGroups[i]['name'];
          sortedNodeForm.push(propsForm['#groups'][group]);
        }


        // now we need to sort the children fields for all groups
        for (var i = 0; i < sortedNodeForm.length; i++) {
          let group = sortedNodeForm[i]['group_name'];
          let fields = sortedNodeForm[i].children;
          let sortFields = [];
          sortedNodeForm[i]['childrenFields'] = []
          for (var k = 0; k < fields.length; k++) {
            var field = fields[k];
            try {
              sortFields.push({'name': field, 'weight': propsForm[field]['#weight']});
            } catch (e) {
              // console.log(field);
            }
          }
          sortFields = weightSort(sortFields);
          for (var k = 0; k < sortFields.length; k++) {
            var field = sortFields[k]['name'];
            var fieldArray = propsForm[field];

            try {
              fieldArray['machine_name'] = field;
            } catch (e) {
              // console.log(field);
            }
            sortedNodeForm[i]['childrenFields'].push(fieldArray);
          }
        }
      }


      const contentType = this.props.navigation.getParam('contentType');
      const node = this.props.navigation.getParam('node');

      const formState = this.props.navigation.getParam('formState');
      const did = this.props.navigation.getParam('did');
      nodeForm = <FormComponent
        form={sortedNodeForm}
        contentType={contentType}
        url={this.props.screenProps.siteUrl}
        node={node}
        screenProps={this.props.screenProps}
        formState={formState}
        did={did}
        navigation={this.props.navigation}

      />
    }

    return (
      <View style={{backgroundColor:'#FFFFFF',flex:1, padding: '5%'}}>
        <KeyboardAwareScrollView style={{backgroundColor:'#FFFFFF',flex:1}}>
          { nodeForm }
        </KeyboardAwareScrollView>
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
