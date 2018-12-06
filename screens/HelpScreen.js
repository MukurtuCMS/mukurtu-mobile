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

export default class HelpScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {

    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Do I need to be online to create content?</Text>
        <Text style={styles.paragraph}>You can create content offline. However, you will need an internet
          connection to login, upload, or sync your content.</Text>
        <Text style={styles.heading}>What does sync do?</Text>
        <Text style={styles.paragraph}>Sync retrieves existing categories, cultural protocol, and communities from
        your Mukurtu CMS site, so you can use them to create content within Mukurtu Mobile.</Text>
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
