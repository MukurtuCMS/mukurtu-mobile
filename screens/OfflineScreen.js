import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebBrowser, SQLite } from 'expo';

const db = SQLite.openDatabase('db.db');

export default class OfflineScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
    }
  }

  static navigationOptions = {
    header: null,
  };

  componentDidMount() {
    console.log('yes');
    db.transaction(tx => {
      tx.executeSql(
        'select * from nodes limit 10;',
        '',
        (_, { rows: { _array } }) => this.updateNodes(_array)
      );
    });
  }

  updateNodes(array) {
    this.setState({nodes: array});
  }

  render() {
    // console.log(this.state.nodes);
    if (this.state.nodes.length < 1) {
      return (
        <View><Text>No nodes were found in offline storage.</Text></View>
      )
    }

    let i = 0;

    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

          <View style={styles.getStartedContainer}>

            <Text style={styles.getStartedText}>Offline test</Text>
            {
              this.state.nodes.map((l) => (
                <View key={i++} style={styles.listWrapper}>
                  <Text style={styles.listTextHeader}>{l.title}</Text>
                  <Text style={styles.listTextBody}>{l.body}</Text>
                </View>
              ))
            }
          </View>

        </ScrollView>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
