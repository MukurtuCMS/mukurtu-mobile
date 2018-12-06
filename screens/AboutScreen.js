import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  TouchableHighlight,
  Alert
} from 'react-native';

export default class AboutScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {

    return (
      <View style={styles.container}>
        <Text style={styles.paragraph}>Mukurtu Mobile is distributed as part of Mukurtu CMS.</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCDCDC',
    padding: '5%',
    textAlign: 'left',
    marginBottom: '2%'
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  paragraph: {
    marginBottom: '5%',
    fontSize: 16,
  }
});
