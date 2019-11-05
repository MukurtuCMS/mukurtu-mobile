import React from 'react';
import {Image, Picker, View, Text, StyleSheet, Button, WebView, Platform} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import Required from "./Required";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import ProgressBar from 'react-native-progress/Bar';
import * as VideoThumbnails from 'expo-video-thumbnails';

// To do on this if we have time:
// 1. Ensure that if images are removed they're removed from drupal side.
// 2. Improve UI for when images are loading so that buttons aren't usable.


export default class Scald extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      numberOfValues: 1,
    };
    this.handleUpload = this.handleUpload.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Set the number of values state when we have it
    if (this.props.formValues.field_media_asset && this.props.formValues.field_media_asset.und &&
      (!prevProps.formValues.field_media_asset)) {
      let count = this.props.formValues.field_media_asset.und.length;
      if (count !== this.state.numberOfValues) {
        this.setState({numberOfValues: count})
      }
    }
  }


  async handleUpload(fieldName, value, type, index = '0', lang = 'und', error = null,) {
    this.props.disableSubmit();

    let indexState = this.state[index];
    indexState['overriden'] = true;
    this.setState({
      [index]: indexState
    });

    let filename = value.uri.split('/').pop();
    let postUrl = this.props.url + '/app/file/create_raw';
    var fd = new FormData();
    fd.append("files", {
      uri: Platform.OS === "android" ? value.uri : value.uri.replace("file:/", ""),
      name: type === 'document' ? value.name : filename,
      type: "multipart/form-data"
    });

    try {
      const fileUpload = await axios({
        method: 'post',
        url: postUrl,
        data: fd,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'X-CSRF-Token': this.props.token,
          'Cookie': this.props.cookie
        },
        onUploadProgress: (progressEvent) => {
          let percentCompleted = progressEvent.loaded / progressEvent.total;
          let indexState = this.state[index];
          indexState['percent'] = percentCompleted;
          this.setState({
            [index]: indexState
          })
        }
      });

      let fid = fileUpload.data[0].fid;

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

      const fileAtom = await fetch(url + '/app/scald/create?id=' + fid, data)
        .then((response) => response.json());

      // Now we have the scald ID, and pass that to the form submission function
      let sid = fileAtom.sid;
      this.props.setFormValue(this.props.fieldName, sid, index);

      this.props.enableSubmit();
    }
    catch (e) {
      console.error(e);
      this.props.enableSubmit();
    }

  }


  addItem() {
    let currentIndex = this.state.numberOfValues;

    this.setState({numberOfValues: currentIndex + 1}, () => {})
  }

  _launchDocumentAsync = async (index) => {
    let result = await DocumentPicker.getDocumentAsync({});
    if (result.type !== 'cancel') {
      this.setState({
        [index]: {
          chosenDocument: result, chosenImage: null, takenImage: null
        }
      });
      this.handleUpload(this.props.fieldName, result, 'document', index);
    }
  }

  _launchCameraRollAsync = async (index) => {
    let {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status !== 'granted') {
      console.error('Camera not granted');
      return
    }

    try {
      let image = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ImagePicker.MediaTypeOptions.All
      });
      console.log(image);

      if (!image.cancelled) {
        const thumbnailUri = await this.getThumbnailUri(image);
        this.setState({
          [index]: {
            chosenImage: image, takenImage: null, chosenDocument: null, thumbnailUri: thumbnailUri
          }
        });

        this.handleUpload(this.props.fieldName, image, 'image', index);
      }

    }
    catch (e) {
      console.log(e);
    }
  }

  _launchCameraAsync = async (index) => {
    let {status} = await Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL)
    if (status !== 'granted') {
      console.log("Camera permission Denied")
    }
    let image = await ImagePicker.launchCameraAsync();
    if (!image.cancelled) {
      const thumbnailUri = await this.getThumbnailUri(image);
      this.setState({
        [index]: {
          takenImage: image, chosenImage: null, chosenDocument: null, thumbnailUri: thumbnailUri
        }
      });
      this.handleUpload(this.props.fieldName, image, 'camera', index);
    }
  }

  removeFile = (index) => {
    this.setState(
      {
        [index]:
          {chosenImage: null, takenImage: null, chosenDocument: null, overRidden: true, percent: null}
      }
    );

    this.props.setFormValue(this.props.fieldName, null, index);
  };

  getThumbnailUri = async (mediaObject) => {
    if (!mediaObject.uri) {
      return null;
    }

    if (mediaObject.type == 'video') {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(
          mediaObject.uri,
          {
            time: 15000,
          }
        );
        return  uri;
      } catch (e) {
        console.warn('Could not create video thumbnail.', e);
      }
    }
    else {
      return mediaObject.uri
    }
  };

  render() {

    let elements = []
    let fieldName = this.props.fieldName;
    const field = this.props.field;
    for (let i = 0; i < this.state.numberOfValues; i++) {

      // Check for existing media value, load it from drupal if it's there
      if (!(this.state[i] && !this.state[i]['overRidden']) &&
        this.props.formValues[fieldName] &&
        this.props.formValues[fieldName]['und'] &&
        this.props.formValues[fieldName]['und'][i] &&
        this.props.formValues[fieldName]['und'][i]['sid']
      ) {
        let sid = this.props.formValues[fieldName]['und'][i]['sid'];

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


            // First check for youtube video
            if (response.base_id && response.provider === 'scald_youtube') {
              this.setState({
                [i]: {
                  'chosenDocument': {
                    // 'name': response.base_entity.filename,
                    'url': 'https://www.youtube.com/watch?v=' + response.base_id
                  }
                }
              })
            } else if (response.base_id && response.provider === 'scald_file') {
              this.setState({
                [i]: {
                  'chosenDocument': {
                    'name': response.base_entity.filename,
                    'uri': response.file_url
                  }
                }
              })
            } else if (response.base_id && response.provider === 'scald_video') {
              this.setState({
                [i]: {
                  'chosenImage': {
                    'name': response.title,
                    'uri': response.thumbnail_url
                  }
                }
              })
            } else if (typeof response.base_entity !== 'undefined') {
              // still need to detect whether this is a doc or an image
              this.setState({
                [i]: {
                  'chosenImage': {
                    'name': response.base_entity.filename,
                    'url': response.thumbnail_url
                  }
                }
              })
            }

          })
          .catch((error) => {
            console.log(error);
          });

      }


      let chosenDocumentText = "Select document";
      let chosenImageText = "Select image/video";
      let takenImageText = "Take photo";
      let removeFileText = "Remove image/video";
      let showRemoveFile = false;
      if (this.state[i] && this.state[i].chosenDocument) {
        chosenDocumentText = "Select a different document";
      }
      if (this.state[i] && this.state[i].chosenImage) {
        chosenImageText = "Select a different image/video";
      }
      if (this.state[i] && this.state[i].takenImage) {
        takenImageText = "Take a different photo";
      }
      if (this.state[i] && this.state[i].chosenDocument) {
        removeFileText = "Remove Document";
      }

      if (this.state[i] && (this.state[i].chosenDocument || this.state[i].chosenImage || this.state[i].takenImage || this.state[i].youtube)) {
        showRemoveFile = true;
      }


      let line;
      if (this.state[i] && this.state[i]['percent'] && this.state[i]['percent'] > 0 && this.state[i]['percent'] < 1) {
        line =
          <View>
            <Text>Uploading...</Text>
            <ProgressBar progress={this.state[i]['percent']} width={200}/>
          </View>
      } else if (this.state[i] && this.state[i]['percent'] && this.state[i]['percent'] === 1) {
        line =
          <View>
            <Text>Upload Complete</Text>
          </View>
      }
      let showButtons = (typeof this.state[i] === 'undefined' ||
        (this.state[i]['chosenDocument'] == null && this.state[i]['chosenImage'] == null && this.state[i]['takenImage'] == null));

      let docbutton;
      let photobutton = null;
      let camerabutton;
      if (showButtons) {
        docbutton = <Button title={chosenDocumentText} onPress={() => this._launchDocumentAsync(i)}/>;
        photobutton = <Button title={chosenImageText} onPress={() => this._launchCameraRollAsync(i)}/>;
        camerabutton = <Button title={takenImageText} onPress={() => this._launchCameraAsync(i)}/>;
      }


      let doctext = null;
      if (this.state[i] && this.state[i].chosenDocument) {
        doctext = <Text
          style={{
            height: 50,
            width: 200,
            textAlign: "center"
          }}>
          {this.state[i].chosenDocument.name}
        </Text>
      }


      let image;
      if (this.state[i] && this.state[i].chosenImage) {

        let imgSrc;
        if (this.state[i].thumbnailUri) {
          imgSrc = {uri: this.state[i].thumbnailUri}
        } else if (this.state[i].chosenImage.url) {
          imgSrc = {uri: this.state[i].chosenImage.url}
        }
        image = <Image
          source={imgSrc}
          style={{
            height: 200,
            width: 200
          }}/>;
      } else if (this.state[i] && this.state[i].youtube) {

        // Using WebView to avoid getting an Api Key for YouTube element
        image = <WebView
          style={{
            height: 200,
            width: 200
          }}
          javaScriptEnabled={true}
          source={{uri: this.state[i].youtube.url}}
        />
      }


      let takenImage = null;
      if (this.state[i] && this.state[i].takenImage) {
        takenImage = <Image
          source={{uri: this.state[i].takenImage.uri}}
          style={{
            height: 200,
            width: 200
          }}/>
      }

      let removefile = null;
      if (showRemoveFile) {
        removefile = <Button color="red" title={removeFileText} onPress={() => this.removeFile(i)}/>;
      }

      let element = <View key={i}>{doctext}{line}{image}{camerabutton}{photobutton}{takenImage}{docbutton}{removefile}</View>;
      elements.push(element);

    }


    let addMoreButton;
    let addMoreText = 'Add Another'; // Default in case it's not passed in props
    if (this.props.addMoreText) {
      addMoreText = this.props.addMoreText;
    }
    // Check for cardinality
    if (this.props.cardinality === '-1') {
      addMoreButton = <Button
        title={addMoreText}
        onPress={this.addItem.bind(this)}
      />
    }


    return (
      <View style={styles.container}>
        <Text>{field['#title']}</Text>
        <Required required={this.props.required}/>
        <View style={{
          flexDirection: 'row'
        }}>
        </View>
        {elements}
        {addMoreButton}
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
    marginBottom: 15
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  }
});
