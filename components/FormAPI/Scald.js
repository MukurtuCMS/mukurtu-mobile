import React from 'react';
import {Image, Picker, View, Text, StyleSheet, Button} from 'react-native';
import {DocumentPicker, ImagePicker, Permissions} from 'expo';
import Constants from 'expo-constants'
import Required from "./Required";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import ProgressBar from 'react-native-progress/Bar';

export default class Scald extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      chosenImage: this.props.chosenImage,
      takenImage: null,
      chosenDocument: null,
      overRidden: false
    };
    this.handleUpload = this.handleUpload.bind(this);
    // this._launchCameraRollAsync = this._launchCameraRollAsync.bind(this);
  }


  handleUpload(fieldName, value, valueKey, lang = 'und', error = null, index = '0') {
    this.setState({'overRidden': true})

    FileSystem.readAsStringAsync(value.uri, {'encoding': FileSystem.EncodingType.Base64})
        .then((base64File) => {
          return base64File;
        })
        .then((file) => {

          // Submit the file to the Drupal site
          // Using Axios so we can do a progress indicator
          let filename = value.uri.split('/').pop();
          let postUrl = this.props.url + '/app/file';


          let result = axios({
            method: 'post',
            url: postUrl,
            data: {
              'filename': filename,
              'file': file
            },
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-CSRF-Token': this.props.token,
              'Cookie': this.props.cookie
            },
            // redirect: 'follow',
            // referrer: 'no-referrer',
            onUploadProgress: (progressEvent) => {
              let percentCompleted = progressEvent.loaded / progressEvent.total;
              this.setState({'percent': percentCompleted})
            }
          });

          return result;

          // return fetch(url + '/app/file', data);
        })
        // .then((response) => response.json())
        .then((response) => {

          // Get the file id
          let fid = response.data.fid;
          // Now we submit the file to create the atom
          const data = {
            method: 'post',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-CSRF-Token': this.props.token,
              'Cookie': this.props.cookie
            },
            redirect: 'follow',
            referrer: 'no-referrer',
          };


          let url = this.props.url;
          return fetch(url + '/app/scald/create?id=' + fid, data);
        })
        .then((response) => response.json())
        .then((response) => {

          // Now we have the scald ID, and pass that to the form submission function
          let sid = response.sid;
          this.props.setFormValue(this.props.fieldName, sid);

        })
        .catch((error) => {
          console.error(error);
        });
  }


  _launchDocumentAsync = async () => {
    let result = await DocumentPicker.getDocumentAsync({});
    this.setState({chosenDocument: result, chosenImage: null, takenImage: null});
    this.handleUpload(this.props.fieldName, result);
  }
  _launchCameraRollAsync = async () => {
    let {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status !== 'granted') {
      console.error('Camera not granted')
      return
    }
    let image = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      aspect: [4, 3],
      exif: true,
    })
    this.setState({chosenImage: image, takenImage: null, chosenDocument: null});

    this.handleUpload(this.props.fieldName, image);

  }
  _launchCameraAsync = async () => {
    let {status} = Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL)
    if (status !== 'granted') {
      console.log("Camera permission Denied")
    }
    let image = await ImagePicker.launchCameraAsync()
    this.setState({takenImage: image, chosenImage: null, chosenDocument: null})
    this.handleUpload(this.props.fieldName, image);
  }
  removeFile = () => {
    this.setState({chosenImage: null, takenImage: null, chosenDocument: null, overRidden: true})
  }

  render() {

    // Check for existing media value, load it from drupal if it's there
    let fieldName = this.props.fieldName;
    if (!this.state.overRidden &&
        this.props.formValues[fieldName] &&
        this.props.formValues[fieldName]['und'] &&
        this.props.formValues[fieldName]['und'][0] &&
        this.props.formValues[fieldName]['und'][0]['sid']
    ) {
      let sid = this.props.formValues[fieldName]['und'][0]['sid'];


      const data = {
        method: 'get',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.props.token,
          'Cookie': this.props.cookie
        },
        redirect: 'follow',
        referrer: 'no-referrer',
      };


      let url = this.props.url;
      fetch(url + '/app/scald/retrieve/' + sid, data)
          .then((response) => {
            return response.json();
          })
          .then((response) => {


            if(typeof response.base_entity !== 'undefined') {

              this.setState({
                'chosenDocument': {
                  'name': response.base_entity.filename
                }
              })
            }

          })
          .catch((error) => {
            console.log(error);
          });

    }


    const field = this.props.field;
    let chosenDocumentText = "Select document";
    let chosenImageText = "Select image";
    let takenImageText = "Take photo";
    let removeFileText = "Remove Image";
    let showRemoveFile = false;
    if (this.state.chosenDocument) {
      chosenDocumentText = "Select a different document";
    }
    if (this.state.chosenImage) {
      chosenImageText = "Select a different image";
    }
    if (this.state.takenImage) {
      takenImageText = "Take a different photo";
    }
    if (this.state.chosenDocument) {
      removeFileText = "Remove Document";
    }

    if (this.state.chosenDocument || this.state.chosenImage || this.state.takenImage) {
      showRemoveFile = true;
    }

    let line;
    if (this.state.percent && this.state.percent > 0 && this.state.percent < 1) {
      line =
          <View>
            <Text>Uploading...</Text>
            <ProgressBar progress={this.state.percent} width={200}/>
          </View>
    } else if (this.state.percent && this.state.percent === 1) {
      line =
          <View>
            <Text>Upload Complete</Text>

          </View>
    }

    return (
        <View style={styles.container}>
          {line}
          <Text>
            {field['#title']}
          </Text>
          <Required required={this.props.required}/>
          <View style={{
            flexDirection: 'row'
          }}>
          </View>
          {this.state.chosenImage === null && this.state.takenImage === null && (
              <Button title={chosenDocumentText} onPress={() => this._launchDocumentAsync()}/>)}
          {this.state.chosenDocument && (<Text
              style={{
                height: 200,
                width: 200
              }}>
            {this.state.chosenDocument.name}
          </Text>)}

          {this.state.chosenDocument === null && this.state.takenImage === null && (
              <Button title={chosenImageText} onPress={() => this._launchCameraRollAsync()}/>)}
          {this.state.chosenImage && (<Image
              source={{uri: this.state.chosenImage.uri}}
              style={{
                height: 200,
                width: 200
              }}/>)}
          {this.state.chosenImage === null && this.state.chosenDocument === null && (
              <Button title={takenImageText} onPress={() => this._launchCameraAsync()}/>)}
          {this.state.takenImage && (<Image
              source={{uri: this.state.takenImage.uri}}
              style={{
                height: 200,
                width: 200
              }}/>)}
          {showRemoveFile && (
              <Button color="red" title={removeFileText} onPress={() => this.removeFile()}/>)}
        </View>

    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
});