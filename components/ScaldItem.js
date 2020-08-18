import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from "expo-file-system";
import * as Sharing from 'expo-sharing';
import { Video } from 'expo-av';
import {FontAwesome} from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import _ from "lodash";

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
      vimeoUrl: null,
      notSynced: false,
      lightbox: false,
      online: true,
    };

  }

  componentDidMount() {
    this.netEventListener = NetInfo.addEventListener(state => {
      this.setState({online: state.isConnected});
    });

    this.props.db.transaction(
      tx => {
        tx.executeSql('select * from atom where sid = ?',
          [this.props.sid],
          (success, atoms) => {
            const atom = atoms.rows._array[0];

            if (atom === undefined) {
              this.setState({notSynced: true});
              return;
            }

            const atomEntity = JSON.parse(atom.entity);
            this.setState({title: atom.title, atom: atomEntity});
            let type = atomEntity.type;
            // const sanitizedFileName = atom.title.replace(/ /g,"_");
            let sanitizedFileName = atom.title.replace(/ /g,"_");
            if (_.has(atomEntity, ['base_entity', 'filename'])) {
              sanitizedFileName = atomEntity.base_entity.filename.replace(/ /g,"_");
            }

            if(type === 'audio') {
              this.setState({'audio': true});
            }

            let provider =  JSON.parse(atom.entity).provider;
            if(['scald_youtube', 'scald_soundcloud'].includes(provider)) {
              return;
            }
            else if(provider === 'scald_vimeo') {
              const VIMEO_ID = JSON.parse(atom.entity).base_id;
              fetch(`https://player.vimeo.com/video/${VIMEO_ID}/config`)
                .then(res => res.json())
                .then(res => this.setState({
                  thumbnailUrl: res.video.thumbs['640'],
                  vimeoUrl: res.request.files.hls.cdns[res.request.files.hls.default_cdn].url,
                  vimeoInfo: res.video,
                }));
            }
            else if(['video', 'audio'].includes(type)) {
              // Probably unnecessary to check this, but was having issues with file saving earlier so keeping it in case
              FileSystem.getInfoAsync(this.props.documentDirectory + sanitizedFileName)
                .then((result) => {
                  if(result.exists) {
                    this.setState({'video': result.uri})
                  } else {
                    console.log('error retrieving scald')
                    console.log(result);
                  }
                });
            }
            else if (['scald_file'].includes(provider)) {
              FileSystem.getInfoAsync(this.props.documentDirectory + sanitizedFileName)
                .then((result) => {
                  if(result.exists) {
                    this.setState({'data': result});
                  } else {
                    console.log('error retrieving scald')
                    console.log(result);
                  }
                });
            }
            else {
              let options = {encoding: FileSystem.EncodingType.Base64};
              FileSystem.readAsStringAsync(this.props.documentDirectory + sanitizedFileName, options)
                .then((savedAtom) => {
                  this.setState({data: savedAtom});
                })
                .catch((error) => {
                  console.log('error getting scald item');
                  console.log(this.props.documentDirectory + sanitizedFileName);
                });
            }
          },
          (success, error) => {
            this.setState({notSynced: true});
          }
        );
      }
    );

  }

  componentWillUnmount() {
    this.netEventListener();
  }

  onShareClick = () => {
    if (this.state.data && this.state.data.uri != null) {
      Sharing.isAvailableAsync()
        .then((available) => {
          if (available) {
            Sharing.shareAsync(this.state.data.uri);
          }
        })
    }
  };

  setModalVisible = (visible) => {
    this.setState({lightbox: visible});
  };


  render() {

    let addModal = false;
    let renderedItem;
    let isYouTube = false;
    const screenWidth = Dimensions.get('window').width;

    const offlineText = (<Text>Content only available online</Text>);

    if (this.state && this.state.atom && !this.state.notSynced) {

      let calcWidth = 300;
      let calcImageHeight = 300;
      if(this.state.atom.base_entity) {
        let width = parseInt(this.state.atom.base_entity.width);
        let height = parseInt(this.state.atom.base_entity.height);

        calcWidth = screenWidth - 40;
        calcImageHeight = screenWidth * .6;
        if(Number.isInteger(width) && Number.isInteger(height)) {
          calcImageHeight = screenWidth * (height / width);
        }
      }



      let response = this.state.atom;

      // First check for video
      if(this.state.video !== null) {
        // Adjust height of player if it's audio
        let videoHeight = 300;
        if(this.state.audio) {
          videoHeight = 50;
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
      else if (response.base_id && ['scald_youtube', 'scald_soundcloud', 'scald_vimeo'].includes(response.provider)) {
        isYouTube = true;
        let html = ''
        if (response.provider === 'scald_youtube') {
          html = `<html>
            <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport" />
            <iframe src="https://www.youtube.com/embed/${response.base_id}?modestbranding=1&playsinline=1&showinfo=0&rel=0" frameborder="0" style="overflow:hidden;overflow-x:hidden;overflow-y:hidden;height:100%;width:100%;position:absolute;top:0px;left:0px;right:0px;bottom:0px" height="100%" width="100%">
            </iframe></html>`;
        }
        else if (response.provider === 'scald_vimeo' && this.state.vimeoInfo !== undefined) {
          const vimeoWidth = this.props.inSlider ? this.props.slideWidth - 22 : screenWidth - 30;
          html = `<html>
             <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport" />
             <iframe src="https://player.vimeo.com/video/${this.state.vimeoInfo.id}?transparent=false" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>
            </html>`;
        }
        else if (response.provider === 'scald_soundcloud') {
          html = `<html>
            <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport" />
            <iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/${response.base_id}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true">
            </iframe></html>`;
        }

        renderedItem = this.state.online ? (<WebView
          style={{
            height: 300,
            width: this.props.inSlider ? this.props.slideWidth - 22 : screenWidth - 30,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000'
          }}
          allowsFullscreenVideo={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          source={{html: html}}
          useWebKit={true}
        />) : offlineText;


      }

      else if (response.base_id && response.provider === 'scald_file' && this.state.data != null) {
        renderedItem = <View style={{alignItems: 'center'}}>
          <TouchableOpacity onPress={this.onShareClick}>
            <FontAwesome name={'file-text-o'} size={25} style={{textAlign: 'center'}} />
            <Text>
              {this.state.title}
            </Text>
          </TouchableOpacity>
        </View>;

      } else if (typeof response.base_entity !== 'undefined') {

        renderedItem = <TouchableOpacity
          onPress={() => this.setModalVisible(true)}>

          <Image
            source={{uri: 'data:image/png;base64,' + this.state.data}}
            resizeMode={'cover'}
            style={{
              height: this.props.inSlider ? 300 : screenWidth - 35,
              width: this.props.inSlider ? screenWidth - 22 : screenWidth - 35,
              borderWidth: this.props.inSlider ? 0 : 3,
              borderColor: '#fff',
              borderRadius: this.props.inSlider ? 0 : 3,
              marginVertical: this.props.inSlider ? 0 : 10
            }}/></TouchableOpacity>;
        addModal = true;
      }
    }
    else if (this.state.notSynced) {
      renderedItem = <Text>This media item is not synced to your device</Text>
    }

    const useStyle = (this.props.inSlider || isYouTube) ? styles.slider : styles.standard;

    return (
      <View style={useStyle}>
        {addModal && <Modal
          animationType="slide"
          transparent={false}
          visible={this.state.lightbox}>
          <View style={{paddingTop: 50, backgroundColor: '#000', height: '100%'}}>

            <Image
              source={{uri: 'data:image/png;base64,' + this.state.data}}
              resizeMode={'contain'}
              style={{
                height: '80%',
                width: '100%',
              }}/>

            <TouchableOpacity
              onPress={() => this.setModalVisible(false)}>

              <FontAwesome
                name={'close'} size={26}
                style={{color: '#fff', textAlign: 'center'}}/>
              <Text style={{color: '#fff', textAlign: 'center'}}>Close</Text>

            </TouchableOpacity>

          </View>
        </Modal>
        }
        {renderedItem}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  standard: {
    alignItems: "center",
    justifyContent: "center"
  },
  slider: {
    alignItems: "center",
    justifyContent: "center",
    height: 300
  }
});

