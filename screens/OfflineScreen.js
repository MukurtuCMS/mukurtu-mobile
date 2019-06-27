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
import {SQLite} from "expo-sqlite";
import * as Sync from "../components/MukurtuSync"
import {Feather, FontAwesome} from "@expo/vector-icons"

export default class OfflineScreen extends React.Component {
  constructor(props) {
    super(props);
    const { navigation, screenProps } = this.props;
    this.state = {nodes: [], db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null};
  }

  static navigationOptions = {
    header: null,
  };

  componentDidMount() {
    this.props.navigation.addListener('willFocus', this.componentActive);
  }

  componentActive = async () => {
    const offlineNodes = await Sync.getSavedOffline(this.state);
    console.log(offlineNodes);
    if (offlineNodes && offlineNodes.length > 0) {
      for (let i = 0; i < offlineNodes.length; i++) {
        offlineNodes[i].blob = JSON.parse(offlineNodes[i].blob);
      }
      this.setState({nodes: offlineNodes})
    }
  }

  editNode(node, did) {
    this.props.navigation.navigate('CreateContentForm', {
      contentType: node.type,
      contentTypeLabel: node.title,
      formState: node,
      did: did
    })
  }

  render() {
    // console.log(this.state.nodes);
    if (this.state.nodes.length < 1) {
      return (
        <View><Text>No nodes are queued for saving.</Text></View>
      )
    }

    let nodes = [];
    for (let i = 0; i < this.state.nodes.length; i++) {
      let warning = '#ffc107';
      const node = this.state.nodes[i];
      if (node.saved === 1) {
        warning = '#28a745';
      }
      if (node.saved === 0 && node.error) {
        warning = '#dc3545'
      }
      nodes.push(
        <TouchableOpacity key={i} onPress={() => this.editNode(node.blob, node.id)}>
          <View style={styles.listWrapper}>
            <View style={styles.innerWrapper}>
              <Text style={styles.listTextHeader}>{node.blob.title}</Text>
            </View>
            <View style={styles.editWrapper}>
              <FontAwesome name="warning" size={24} color={warning} />
            </View>
          </View>
        </TouchableOpacity>
      )
    }

    let i = 0;

    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {nodes}
        </ScrollView>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10
  },
  listWrapper: {
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'gray'
  },
  innerWrapper: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'wrap',
  },
  editWrapper: {
    flexShrink: 0,
    paddingTop: 5
  },
  listTextHeader: {
    fontSize: 20
  }
});
