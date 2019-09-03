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

            FileSystem.readAsStringAsync(FileSystem.documentDirectory + atom.title)
              .then((savedAtom) => {
                this.setState({data: savedAtom});
              })
              .catch((error) => {
                console.log('error getting scald item');
              });
          },
          (success, error) => ''
        );
      }
    );

  }

  gcd(a, b) {
    return (b == 0) ? a : this.gcd(b, a % b);
  }

  render() {

    let renderedItem;
    // First check for youtube video
    if (this.state && this.state.atom) {

      const width = parseInt(this.state.atom.base_entity.width);
      const height = parseInt(this.state.atom.base_entity.height);
      const gcd = this.gcd(width, height);

      const screenWidth = Dimensions.get('window').width;
      const aspectWidth = width / gcd;
      const aspectHeight = height / gcd;

      const calcImageHeight = screenWidth / aspectWidth * aspectHeight;

      let response = this.state.atom;
      if (response.base_id && response.provider === 'scald_youtube') {

        renderedItem = <WebView
          style={{
            height: 200,
            width: 200
          }}
          javaScriptEnabled={true}
          source={{uri: 'https://www.youtube.com/watch?v=' + response.base_id}}
        />;


      } else if (response.base_id && response.provider === 'scald_file') {
        renderedItem = <Text
          style={{
            height: 200,
            width: 200
          }}>
          {this.state.data}
        </Text>;

      } else if (typeof response.base_entity !== 'undefined') {

        renderedItem = <Image
          source={{uri: 'data:image/png;base64,' + this.state.data}}
          style={{
            height: calcImageHeight,
            width: screenWidth
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

