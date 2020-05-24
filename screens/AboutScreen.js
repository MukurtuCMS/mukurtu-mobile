import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Colors from "../constants/Colors";

export default class AboutScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {}
  }

  render() {

    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>Mukurtu Mobile is distributed as part of
          Mukurtu CMS.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    padding: '5%',
    textAlign: 'left',
    marginBottom: '2%'
  },
  paragraph: {
    marginBottom: '5%',
    fontSize: 16,
  }
});
