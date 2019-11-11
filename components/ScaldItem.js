import React from 'react';
import {Image, StyleSheet, Text, View, WebView, Dimensions} from 'react-native';
import {SQLite} from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import { Video, Audio } from 'expo-av';

export class ScaldItem extends React.Component {
  // A lot of overlap between this and the form scald components,
  // but those currently do a bunch of state updating on the node form,
  // and it seems very complicated to abstract that so that they could use a common scalditem component.
  constructor(props) {
    super(props);
    // Pass props down from App.js, since we're not using Redux
    this.state = {
      title: null,
      data: null,
      atom: null,
      video: null,
      audio: false,
      vimeoUrl: null
    }
  }

componentDidMount() {

    this.props.db.transaction(
      tx => {
        tx.executeSql('select * from atom where sid = ?',
          [this.props.sid],
          (success, atoms) => {
            const atom = atoms.rows._array[0];

            this.setState({title: atom.title, atom: JSON.parse(atom.entity)});
            let type = JSON.parse(atom.entity).type;
            if(type === 'audio') {
              this.setState({'audio': true});
            }

            let provider =  JSON.parse(atom.entity).provider;
            if(['scald_youtube'].includes(provider)) {
              return;
            } else if(provider === 'scald_vimeo') {
              const VIMEO_ID = JSON.parse(atom.entity).base_id;
              fetch(`https://player.vimeo.com/video/${VIMEO_ID}/config`)
                .then(res => res.json())
                .then(res => this.setState({
                  thumbnailUrl: res.video.thumbs['640'],
                  vimeoUrl: res.request.files.hls.cdns[res.request.files.hls.default_cdn].url,
                  vimeoInfo: res.video,
                }));
            }else if(['video', 'audio'].includes(type)) {
              // Probably unnecessary to check this, but was having issues with file saving earlier so keeping it in case
              FileSystem.getInfoAsync(this.props.documentDirectory + atom.title)
                .then((result) => {
                  if(result.exists) {
                    this.setState({'video': result.uri})
                  } else {
                    console.log('error retrieving scald')
                    console.log(result);
                  }
                });

            }
            else {
              let options = {encoding: FileSystem.EncodingType.Base64};
              FileSystem.readAsStringAsync(this.props.documentDirectory + atom.title, options)
                .then((savedAtom) => {
                  this.setState({data: savedAtom});
                })
                .catch((error) => {
                  console.log('error getting scald item');
                  console.log(this.props.documentDirectory + atom.title);
                });
            }
          },
          (success, error) => ''
        );
      }
    );

  }


  render() {

    let renderedItem;

    if (this.state && this.state.atom) {

      let calcWidth = 300;
      let calcImageHeight = 200;
      if(this.state.atom.base_entity) {
         let width = parseInt(this.state.atom.base_entity.width);
         let height = parseInt(this.state.atom.base_entity.height);
        const screenWidth = Dimensions.get('window').width;
        calcWidth = screenWidth - 40;
        let calcImageHeight = screenWidth * .6;
        if(Number.isInteger(width) && Number.isInteger(height)) {
          calcImageHeight = screenWidth * (height / width);
        }
      }



      let response = this.state.atom;

      // First check for video
      if(this.state.video !== null) {
        // Adjust height of player if it's audio
        let videoHeight = '100%';
        if(this.state.audio) {
          videoHeight = 45;
        }
        renderedItem =  <Video
          source={{uri: this.state.video}}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode={Video.RESIZE_MODE_CONTAIN}
          useNativeControls={true}
          style={{width: '100%', height: videoHeight}}
        />
      }
      // Then check for youtube
      else if (response.base_id && response.provider === 'scald_youtube') {

        renderedItem = <WebView
          style={{
            height: calcImageHeight,
            width: calcWidth
          }}
          javaScriptEnabled={true}
          source={{uri: 'https://www.youtube.com/watch?v=' + response.base_id}}
        />;


      }
      else if (this.state.vimeoUrl !== null) {
        renderedItem =  <Video
          source={{uri: this.state.vimeoUrl}}
          // navigator={this.props.navigator}
          fullscreen={true}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode={Video.RESIZE_MODE_CONTAIN}
          useNativeControls={true}
          style={{width: '100%', height: '80%'}}
        />
      }

      else if (response.base_id && response.provider === 'scald_file') {
        renderedItem = <Text
          style={{
            height: calcImageHeight,
            width: calcWidth
          }}>
          {this.state.data}
        </Text>;

      } else if (typeof response.base_entity !== 'undefined') {

        renderedItem = <Image
          source={{uri: 'data:image/png;base64,' + this.state.data}}
          style={{
            height: calcImageHeight,
            width: calcWidth
          }}/>;
      }
    }


    return (
      <View>
        {renderedItem}
      </View>
    )
  }
}

