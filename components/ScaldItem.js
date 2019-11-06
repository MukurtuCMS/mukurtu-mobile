import React from 'react';
import {Image, StyleSheet, Text, View, WebView, Dimensions} from 'react-native';
import {SQLite} from "expo-sqlite";
import * as FileSystem from "expo-file-system";

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
      atom: null
    }
  }

  async componentDidMount() {

    this.props.db.transaction(
      tx => {
        tx.executeSql('select * from atom where sid = ?',
          [this.props.sid],
          (success, atoms) => {
            const atom = atoms.rows._array[0];

            this.setState({title: atom.title, atom: JSON.parse(atom.entity)});

            let options = { encoding: FileSystem.EncodingType.Base64 };
            FileSystem.readAsStringAsync(this.props.documentDirectory + atom.title, options)
              .then((savedAtom) => {
                this.setState({data: savedAtom});
              })
              .catch((error) => {
                console.log('error getting scald item');
                console.log(this.props.documentDirectory + atom.title);
              });
          },
          (success, error) => ''
        );
      }
    );

  }

  gcd(a, b) {
    if(isNaN(a) && isNaN(b)) {
      return 1;
    }
    if ( ! b) {
      return a;
    }
    return this.gcd(b, a % b);
  }

  render() {

    let renderedItem;
    // First check for youtube video
    if (this.state && this.state.atom && this.state.atom.base_entity) {

      const width = parseInt(this.state.atom.base_entity.width);
      const height = parseInt(this.state.atom.base_entity.height);

      const screenWidth = Dimensions.get('window').width;
      let calcWidth = screenWidth - 40;
      let calcImageHeight = screenWidth * .6;
      if(Number.isInteger(width) && Number.isInteger(height)) {
        calcImageHeight = screenWidth * (height / width);
      }

      let response = this.state.atom;
      if (response.base_id && response.provider === 'scald_youtube') {

        renderedItem = <WebView
          style={{
            height: calcImageHeight,
            width: calcWidth
          }}
          javaScriptEnabled={true}
          source={{uri: 'https://www.youtube.com/watch?v=' + response.base_id}}
        />;


      } else if (response.base_id && response.provider === 'scald_file') {
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

