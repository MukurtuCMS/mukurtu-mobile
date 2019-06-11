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
import {FileSystem, SQLite} from 'expo';
import FormComponent from '../components/FormAPI/Form'
import axios from "axios";
import weightSort from 'weight-sort';
import JSONTree from "react-native-json-tree";

class CreateContentFormScreen extends React.Component {
  static navigationOptions = ({navigation}) => ({
    title: 'Create ' + `${navigation.getParam('contentTypeLabel')}`,
  });

  constructor(props) {
    super(props);
    const { navigation, screenProps } = this.props;
    this.state = {switchValue: false, loggedIn: false, token: false, user: {}, places: '', placeName: '', form: [], oldForm: '', isConnected: false, db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null};
    this.onPress = this.onPress.bind(this);
  }

  componentDidMount() {
    this.props.navigation.addListener('willFocus', this.componentActive)
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  retrieveContentType(array) {
    if (array.length > 0 && array[0].blob !== undefined) {
      this.setState({form: JSON.parse(array[0].blob), oldForm: JSON.parse(array[0].blob)});
    }
  }

  componentActive = () => {
    // first set content types from db, then try connecting
    if (!this.state.db) {
      this.alertNotLoggedIn();
    } else {
      this.state.db.transaction(tx => {
        tx.executeSql(
          'select blob from content_type where machine_name = ?;',
          [this.props.navigation.getParam('contentType')],
          (_, {rows: {_array}}) => this.retrieveContentType(_array)
        );
      });

      if (this.state.isConnected) {
        this.state.db.transaction(tx => {
          tx.executeSql(
            'select * from auth limit 1;',
            '',
            (_, {rows: {_array}}) => this.getType(_array)
          );
        });
      }
    }
  }

  getType(array) {
    const contentType = this.props.navigation.getParam('contentType');

    if (array === undefined || array.length < 1) {
      this.alertNotLoggedIn();
      return false;
    }
    const token = array[0].token;
    const cookie = array[0].cookie;

    let data = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie
      }
    };
    fetch(this.props.screenProps.siteUrl + '/app/node-form-fields/retrieve/' + contentType, data)
        .then((response) => response.json())
        .then((responseJson) => {
          let form = responseJson;
          let groups = {};

          for (const [machineName, groupObject] of Object.entries(form['#groups'])) {

          }

          this.setState({form: responseJson, oldForm: responseJson});
        })
        .catch((error) => {
          // console.error(error);
        });
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

    let nodeForm = [];
    const formObject = Object.entries(this.state.form).length;
    if (formObject > 0) {

      // we need to order the form by groups and fields
      let sortedNodeForm = [];
      let sortGroups = [];

      if (this.state.form['#groups'].length === 0) {
        sortedNodeForm = Object.values(this.state.form);
      } else {
        let groups = this.state.form['#groups']['group_tabs'].children;
        for (var i = 0; i < groups.length; i++) {
          var group = groups[i];
          sortGroups.push({'name': group, 'weight': this.state.form['#groups'][group]['weight']});
        }
        sortGroups = weightSort(sortGroups);
        for (var i = 0; i < sortGroups.length; i++) {
          var group = sortGroups[i]['name'];
          sortedNodeForm.push(this.state.form['#groups'][group]);
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
              sortFields.push({'name': field, 'weight': this.state.form[field]['#weight']});
            } catch (e) {
              // console.log(field);
            }
          }
          sortFields = weightSort(sortFields);
          for (var k = 0; k < sortFields.length; k++) {
            var field = sortFields[k]['name'];
            var fieldArray = this.state.form[field];

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
      nodeForm = <FormComponent form={sortedNodeForm} contentType={contentType} url={this.props.screenProps.siteUrl}
                                node={node}/>
    }

    return (
        <View style={{backgroundColor: '#EFEFF4', flex: 1, padding: '5%'}}>
          <ScrollView style={{backgroundColor: '#EFEFF4', flex: 1}}>
            {/*<JSONTree data={this.state.oldForm} />*/}
            {nodeForm}
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
