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
import {getFieldValueCount} from './formUtils';
import {FontAwesome} from "@expo/vector-icons";
import NetInfo from '@react-native-community/netinfo';
import {Video} from "expo-av";

// To do on this if we have time:
// 1. Ensure that if images are removed they're removed from drupal side.
// 2. Improve UI for when images are loading so that buttons aren't usable.


export default class Scald extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      remoteProvider: ['scald_dailymotion', 'scald_vimeo', 'scald_youtube', 'scald_soundcloud'],
      numberOfValues: 0,
      permission: true,
      existingElements: {},
      add: 0,
      uploadProgress: {},
      placeholder: {},
      updateExisting: false
    };
    this.handleUpload = this.handleUpload.bind(this);
  }

  componentDidMount() {
    this.loadLocalAtomData();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if ((!prevProps.nodeLoaded && this.props.nodeLoaded) || (!prevState.updateExisting && this.state.updateExisting)) {
      this.loadLocalAtomData();
    }
  }

  loadLocalAtomData = () => {
    const {fieldName, formValues} = this.props;

    if (formValues[fieldName] !== undefined && formValues[fieldName].und != null) {
      const {db, documentDirectory} = this.props;
      const existingSids = Object.keys(formValues[fieldName].und).map(key => formValues[fieldName].und[key].sid);

      if (existingSids.length > 0) {

        db.transaction(tx => {
          const inClause = existingSids.join(',');
          tx.executeSql(`select * from atom WHERE sid IN (${inClause})`,
            '',
            (success, atoms) => {
              let elements = {};
              atoms.rows._array.forEach((atom) => {
                const atomEntity = JSON.parse(atom.entity);
                // @todo: Check here if this is an offline atom
                // Remote Provider
                if (this.state.remoteProvider.includes(atomEntity.provider)) {
                  const providerString = atomEntity.provider.split('_');
                  elements[atom.sid] = {
                    sid: atom.sid,
                    title: `${providerString[1]}: ${atom.title}`,
                    type: atomEntity.type,
                    remote: true
                  };
                }
                else {
                  elements[atom.sid] = {
                    sid: atom.sid,
                    title: `${atom.title}`,
                    remote: false,
                    type: atomEntity.type,
                    file: documentDirectory + atom.title
                  };
                }
              });
              this.setState({
                numberOfValues: existingSids.length,
                existingElements: elements,
                updateExisting: false
              });
            });
        })
      }
    }
  };


  async handleUpload(fieldName, value, type, index = '0', lang = 'und', error = null,) {

    this.props.disableSubmit();
    const online = await NetInfo.fetch().then(state => state.isConnected);
    let filename = type === 'document' ? value.name : value.uri.split('/').pop();
    // let indexState = this.state[index];
    // indexState['overriden'] = true;
    // this.setState({
    //   [index]: indexState
    // });

    if (online) {
      let postUrl = this.props.url + '/app/file/create_raw';
      var fd = new FormData();
      fd.append("files", {
        uri: Platform.OS === "android" ? value.uri : value.uri.replace("file:/", ""),
        name: filename,
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
            // let indexState = this.state[index];
            // indexState['percent'] = percentCompleted;
            this.setState({
              uploadProgress: {
                [index]: percentCompleted
              }
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

        const createdScald = await fetch(url + '/app/scald/create?id=' + fid, data)
          .then((response) => response.json());

        data.method = 'GET';
        const scaldData = await fetch(url + '/app/scald/retrieve/' + createdScald.sid + '.json', data)
          .then((response) => response.json());

        let e=1;
        const sanitiziedName = filename.replace(/ /g,"_");
        const copyFile = await FileSystem.copyAsync({
          from: value.uri,
          to: this.props.documentDirectory + sanitiziedName
        });

        const saveAtom = await this.saveAtom(scaldData);

        this.props.setFormValue(this.props.fieldName, scaldData.sid, index);
        this.props.enableSubmit();
        this.setState((state) => {
          return {
            placeholder: {},
            updateExisting: true,
            add: state.add - 1,
            uploadProgress: {}
          }
        });
          // .catch((error) => console.log(error));

        // Now we have the scald ID, and pass that to the form submission function
        // let sid = fileAtom.sid;

      }
      catch (e) {
        console.error(e);
        this.props.enableSubmit();
      }
    }
    else {

      const copyFile = await FileSystem.copyAsync({
        from: value.uri,
        to: this.props.documentDirectory + filename
      });

      const tmpSid = Math.floor(Math.random() * 100000000);

      const atom = {
        sid: parseInt(`919191${tmpSid}`),
        type: type,
        title: filename
      };

      const saveAtom = await this.saveAtom(atom);
      this.props.setFormValue(this.props.fieldName, atom.sid, index, 'sid', 'und', null, true);
      this.props.enableSubmit();
      this.setState((state) => {
        return {
          placeholder: {},
          updateExisting: true,
          add: state.add - 1
        }
      });
    }

  }

  async saveAtom(atom) {
    return new Promise((resolve, reject) => {
      this.props.db.transaction(
        tx => {
          tx.executeSql('replace into atom (sid, title, entity) values (?, ?, ?)',
            [atom.sid, atom.title, JSON.stringify(atom)],
            (_, data) => {resolve(atom.sid)},
            (_, error) => { reject(error);}
          );
        }
      );
    });
  }


  addItem() {
    // let currentIndex = this.state.numberOfValues;

    this.setState((state) => {
      return {add: state.add + 1};
    });
  }

  _launchDocumentAsync = async (index, mediaTypes) => {
    const options = {type: '*/*'};
    if (mediaTypes.includes('audio') && !mediaTypes.includes('file')) {
      options.type = 'audio/*';
    }

    let result = await DocumentPicker.getDocumentAsync(options);
    if (result.type !== 'cancel') {
      // this.setState({
      //   [index]: {
      //     chosenDocument: result, chosenImage: null, takenImage: null
      //   }
      // });
      this.handleUpload(this.props.fieldName, result, 'document', index);
    }
  }

  _launchCameraRollAsync = async (index, mediaTypes) => {
    let mediaType =  ImagePicker.MediaTypeOptions.Images;
    if (mediaTypes.includes('video')) {
      mediaType = ImagePicker.MediaTypeOptions.All;
    }

    let {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status !== 'granted') {
      console.error('Camera not granted');
      this.setState({'permission': false});
      return
    }

    try {
      let image = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: mediaType
      });

      if (!image.cancelled) {
        const thumbnailUri = await this.getThumbnailUri(image);

        this.setState({
            placeholder: {
              [index]: thumbnailUri
            }
          }, () => {
            this.handleUpload(this.props.fieldName, image, 'image', index);
          }
        );
      }

    }
    catch (e) {
      console.log(e);
    }
  }

  _launchCameraAsync = async (index, mediaTypes) => {
    const options = {mediaTypes: ImagePicker.MediaTypeOptions.Images};
    if (mediaTypes.includes('video')) {
      options.mediaTypes = ImagePicker.MediaTypeOptions.All;
    }

    let {status} = await Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL)
    if (status !== 'granted') {
      this.setState({'permission': false});
      console.log("Camera permission Denied");
      return;
    }
    let image = await ImagePicker.launchCameraAsync(options);
    if (!image.cancelled) {
      const thumbnailUri = await this.getThumbnailUri(image);
      this.setState({
          placeholder: {
            [index]: thumbnailUri
          }
        }, () => {
          this.handleUpload(this.props.fieldName, image, 'camera', index);
        }
      );
    }
  }

  removeFile = async (index) => {
    // this.setState(
    //   {
    //     [index]:
    //       {chosenImage: null, takenImage: null, chosenDocument: null, overRidden: true, percent: null}
    //   }
    // );

    const online = await NetInfo.fetch().then(state => state.isConnected);
    this.props.setFormValue(this.props.fieldName, null, index, 'sid', 'und', null, !online);
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

  getAllowedMediaTypes = (field) => {
    if (field['#attributes'] !== undefined && field['#attributes'].constructor === Object ) {
      return field['#attributes']['data-types'].split(',');
    }
    else if(field.sid['#attributes'] !== undefined && field.sid['#attributes'].constructor === Object) {
      return field.sid['#attributes']['data-types'].split(',');
    }
    return [];
  };


  render() {
    const {fieldName, field, formValues, thisKey} = this.props;
    const allowedMediaTypes = this.getAllowedMediaTypes(field);
    let fieldCount = getFieldValueCount(formValues[fieldName]) + this.state.add;
    fieldCount = fieldCount || 1;
    let elements = [];
    for (let i = 0; i < fieldCount; i++) {
      const sid = (((formValues[fieldName] || {})['und'] || {})[i] || {})['sid'] || 0;
      const {existingElements} = this.state;
      if (sid && existingElements[sid] != null) {

        let mediaIconType = 'file-text-o';
        switch (existingElements[sid].type) {
          case 'video':
            mediaIconType = 'file-video-o';
            break;

          case 'audio':
            mediaIconType = 'file-audio-o';
            break;

          case 'image':
            mediaIconType = 'file-image-o';
            break;
        }
        const mediaIcon = <FontAwesome name={mediaIconType} size={16} />;

        const removeFileText = `Remove ${existingElements[sid].type}`;
        const removeButton = <Button color="red" title={removeFileText} onPress={() => this.removeFile(i)}/>;

        let mediaElement;

        if (existingElements[sid].type === 'image') {
          const uri = this.state.placeholder[i] != null ? this.state.placeholder[i] : existingElements[sid].file;
          mediaElement = (
            <Image
              source={{uri: uri}}
              resizeMode={'contain'}
              style={{
                height: 300,
                width: 350
              }}/>
          );
        }
        else if (existingElements[sid].type === 'video' && !existingElements[sid].remote) {
          const thumbnail = this.state.placeholder[i] != null ? this.state.placeholder[i] : false;
          mediaElement = thumbnail ? (<Image
                source={{uri: thumbnail}}
                resizeMode={'contain'}
                style={{
                  height: 300,
                  width: 350
                }}/>) :
            (<Video
              source={{uri: existingElements[sid].file}}
              rate={1.0}
              volume={1.0}
              isMuted={true}
              resizeMode={Video.RESIZE_MODE_CONTAIN}
              useNativeControls={true}
              style={{width: 350, height: 300}}
            />);
        }

        else {
          mediaElement = <Text style={{textTransform: 'uppercase', fontSize: 16}}>{mediaIcon} {existingElements[sid].title}</Text>
        }

        const el =(
          <View style={styles.element} key={i}>
            {mediaElement}
            {removeButton}
          </View>);
        elements.push(el);
      }
      else if (sid && existingElements[sid] === undefined) {
        elements.push(<Text key={sid}>Media Item not synced from server.</Text>)
      }
      else {
        let preview;
        if (this.state.placeholder[i] != null) {
          preview = (<Image
            source={{uri: this.state.placeholder[i]}}
            resizeMode={'contain'}
            style={{
              height: 300,
              width: 350
            }}/>);
        }

        const buttons = [];
        if (allowedMediaTypes.includes('image') || allowedMediaTypes.includes('video')) {
          buttons.push(<Button key={'roll-btn'} title={'Select photo/video'}
                               onPress={() => this._launchCameraRollAsync(i, allowedMediaTypes)}/>);
          buttons.push(<Button key={'camera-btn'} title={'Take photo/video'}
                               onPress={() => this._launchCameraAsync(i, allowedMediaTypes)}/>);
        }
        if (allowedMediaTypes.includes('audio') || allowedMediaTypes.includes('file')) {
          buttons.push(<Button key={'file-btn'} title={'Select audio/document'}
                               onPress={() => this._launchDocumentAsync(i, allowedMediaTypes)}/>);
        }

        let line;
        let showButtons = true;
        if (this.state.uploadProgress[i] && this.state.uploadProgress[i] > 0 && this.state.uploadProgress[i] < 1) {
          showButtons = false;
          line = (<View>
            <Text>Uploading...</Text>
            <ProgressBar progress={this.state.uploadProgress[i]} width={200}/>
          </View>);
        }
        else if (this.state.uploadProgress[i] && this.state.uploadProgress[i] === 1) {
          showButtons = false;
          line = (<View>
            <Text>Upload Complete. Syncing data. Please wait...</Text>
          </View>);
        }

        elements.push(<View style={styles.element} key={`btn-group-${i}`}>
          {preview}
          {line}
          {showButtons && buttons}
        </View>);
      }

      if(!this.state.permission) {
        elements.push(<Text key={'warning'}>To upload media, please give this app permission to access
            photos/camera in your device's settings.</Text>);
      }

    }

    let addMoreButton;
    let addMoreText = 'Add Another'; // Default in case it's not passed in props
    if (this.props.addMoreText) {
      addMoreText = this.props.addMoreText;
    }
    // Check for cardinality
    if (this.props.cardinality === '-1' && this.state.permission) {
      addMoreButton = <Button
        title={addMoreText}
        onPress={this.addItem.bind(this)}
      />
    }

    const titleText = field['#title'] != null && field['#title'].length > 0 ? field['#title'] : 'Media Assets';

    return (
      <View>
        <Text style={styles.titleTextStyle}>{titleText}</Text>
        <Required required={this.props.required}/>
        <View style={styles.container}>
          {elements}
        </View>
        {addMoreButton}
      </View>)
      ;

  }

  _bob() {

    let elements = []
    let fieldName = this.props.fieldName;
    const field = this.props.field;
    const allowedMediaTypes = this.getAllowedMediaTypes(field);
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


      let chosenDocumentText = "Select audio/document";
      let chosenImageText = "Select image/video";
      let takenImageText = "Take photo";
      let removeFileText = "Remove image/video";
      let showRemoveFile = false;
      if (this.state[i] && this.state[i].chosenDocument) {
        chosenDocumentText = "Select a different audio/document";
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

      if (this.state[i] && this.state.permission && (this.state[i].chosenDocument || this.state[i].chosenImage || this.state[i].takenImage || this.state[i].youtube)) {
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
      let showButtons = (
        typeof this.state[i] === 'undefined' ||
        (this.state.permission &&
          this.state[i]['chosenDocument'] == null &&
          this.state[i]['chosenImage'] == null &&
          this.state[i]['takenImage'] == null
        ));

      let docbutton;
      let photobutton = null;
      let camerabutton;
      let permissionText;
      if (showButtons) {
        if (allowedMediaTypes.includes('image') || allowedMediaTypes.includes('video')) {
          photobutton = <Button title={chosenImageText} onPress={() => this._launchCameraRollAsync(i)}/>;
          camerabutton = <Button title={takenImageText} onPress={() => this._launchCameraAsync(i)}/>;
        }
        if (allowedMediaTypes.includes('audio') || allowedMediaTypes.includes('file')) {
          docbutton = <Button title={chosenDocumentText} onPress={() => this._launchDocumentAsync(i, allowedMediaTypes)}/>;
        }

      }
      else if(!this.state.permission) {
        permissionText = <Text>To upload media, please give this app permission to access photos/camera in your device's settings.</Text>
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

      let element = <View style={styles.element} key={i}>{doctext}{line}{image}{camerabutton}{photobutton}{takenImage}{docbutton}{removefile}{permissionText}</View>;
      elements.push(element);

    }


    let addMoreButton;
    let addMoreText = 'Add Another'; // Default in case it's not passed in props
    if (this.props.addMoreText) {
      addMoreText = this.props.addMoreText;
    }
    // Check for cardinality
    if (this.props.cardinality === '-1' && this.state.permission) {
      addMoreButton = <Button
        title={addMoreText}
        onPress={this.addItem.bind(this)}
      />
    }


    return (
      <View>
        <Text style={styles.titleTextStyle}>Media Assets</Text>
        <Required required={this.props.required}/>
        <View style={styles.container}>
          {elements}
        </View>
        {addMoreButton}
      </View>

    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
    paddingTop: 0,
    backgroundColor: '#ecf0f1',
    marginBottom: 10,
    // flexDirection: 'column'
  },
  titleTextStyle: {

    color: '#000',
    fontSize: 20,
    fontWeight: 'bold'
  },
  element: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    paddingTop: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#fff'
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  }
});
