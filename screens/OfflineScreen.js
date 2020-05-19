import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import {SQLite} from "expo-sqlite";
import * as Sync from "../components/MukurtuSync"
import {Feather, FontAwesome} from "@expo/vector-icons"
import * as Colors from "../constants/Colors";

export default class OfflineScreen extends React.Component {
  constructor(props) {
    super(props);
    const {navigation, screenProps} = this.props;
    this.state = {
      nodes: [],
    };
  }

  static navigationOptions = {
    title: 'Queued Content',
    headerStyle: {
      backgroundColor: Colors.default.gold,
      marginTop: -20,
    },
    headerTintColor: '#000',
  };

  componentDidMount() {
    this.props.navigation.addListener('willFocus', this.componentActive);

    if (!this.props.screenProps.db) {
      return;
    }

    this.props.screenProps.db.transaction(
      tx => {
        tx.executeSql('select * from saved_offline',
          [],
          (success, array) => {
            console.log('queueing');
            let offlineNodes = [];
            for (let i = 0; i < array.rows._array.length; i++) {
              let id = array.rows._array[i].id;
              let message = '';
              if (this.props.screenProps.nodeSyncMessages[id]) {
                message = this.props.screenProps.nodeSyncMessages[id].message;
              }
              let tempNode = {
                'blob': JSON.parse(array.rows._array[i].blob),
                'id': id,
                'message': message
              }
              offlineNodes.push(tempNode);
            }
            this.setState({'nodes': offlineNodes});
          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );

  }

  componentDidUpdate(prevProps, prevState, snapshot) {

    if (!this.props.screenProps.db) {
      return;
    }

    this.props.screenProps.db.transaction(
      tx => {
        tx.executeSql('select * from saved_offline',
          [],
          (success, array) => {
            console.log('queueing');
            let offlineNodes = [];
            for (let i = 0; i < array.rows._array.length; i++) {
              let id = array.rows._array[i].id;
              let message = '';
              if (this.props.screenProps.nodeSyncMessages[id]) {
                message = this.props.screenProps.nodeSyncMessages[id].message;
              }
              let tempNode = {
                'blob': JSON.parse(array.rows._array[i].blob),
                'id': id,
                'message': message
              }
              offlineNodes.push(tempNode);
            }

            if(this.state.nodes.length !== offlineNodes.length) {
              this.setState({'nodes': offlineNodes});
            }
          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );
  }

  componentActive = async () => {
    // const offlineNodes = await Sync.getSavedOffline(this.state);
    // console.log(offlineNodes);
    // if (offlineNodes && offlineNodes.length > 0) {
    //   for (let i = 0; i < offlineNodes.length; i++) {
    //     offlineNodes[i].blob = JSON.parse(offlineNodes[i].blob);
    //   }
    //   this.setState({nodes: offlineNodes})
    // }
  }



  editNode(node, did) {
    this.props.navigation.navigate('CreateContentForm', {
      contentType: node.type,
      contentTypeLabel: node.title,
      formState: node,
      did: did,
      editWord: 'Create'
    })
  }

  render() {
    // console.log(this.state.nodes);
    if (this.state.nodes.length < 1) {


      return (
        <View style={styles.wrapper}>
          <Text style={styles.text}>No content is queued for saving.</Text>
        </View>
      )
    }

    let nodes = [];
    for (let i = 0; i < this.state.nodes.length; i++) {
      let warning = '#ffc107';
      const node = this.state.nodes[i];
      // if (node.saved === 1) {
      //   warning = '#28a745';
      // }
      // if (node.saved === 0 && node.error) {
      //   warning = '#dc3545'
      // }
      let message;
      if (node.message) {
        message = <Text style={{'color': '#dc3545'}}>{node.message}</Text>
      }
      nodes.push(
        <TouchableOpacity key={i} onPress={() => this.editNode(node.blob, node.id)}>
          <View style={styles.listWrapper}>
            <View style={styles.innerWrapper}>
              <Text style={styles.listTextHeader}>{node.blob.title}</Text>
              {message}
            </View>
            <View style={styles.editWrapper}>
              <Feather name="edit" size={24} color="gray"/>
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
  },
  wrapper: {
    padding: 30,
    textAlign: 'center'
  },

  text: {
    fontSize: 18,
    textAlign: 'center',
    paddingBottom: 20
  },
});
