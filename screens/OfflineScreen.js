import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Feather} from "@expo/vector-icons"
import CustomBackButton from '../components/CustomBackButton';

export default class OfflineScreen extends React.Component {
  constructor(props) {
    super(props);
    const {navigation, screenProps} = this.props;
    this.state = {
      nodes: [],
    };
  }

  static navigationOptions = ({navigation}) => {
    return {
      title: 'Queued Content',
      headerLeft: () => <CustomBackButton navigation={navigation}/>
    }
  };

  componentDidMount() {

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

  editNode(node, did) {
    this.props.navigation.navigate('CreateContentForm', {
      contentType: node.type,
      contentTypeLabel: node.title,
      formState: node,
      did: did,
      editWord: 'Create'
    })
  }

  removeNode = (nid) => {
    this.props.screenProps.db.transaction(
      tx => {
        tx.executeSql('delete from saved_offline where id = ?', [nid],
          () => {
            const newQueue = this.state.nodes.filter(node => node.id !== nid);
            this.setState({
              nodes: newQueue
            })
          })
      });
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
      let errorMessage = null;
      if (this.props.screenProps.nodeSyncMessages[node.id]) {
        errorMessage = this.props.screenProps.nodeSyncMessages[node.id].message;
      }
      if (errorMessage) {
        message = <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.removeButton} onPress={() => this.removeNode(node.id)}>
            <Text style={styles.removeButtonText}>Remove from queue</Text>
          </TouchableOpacity>
        </View>
      }
      nodes.push(
        <View key={i} style={styles.listWrapper}>
          <View style={styles.innerWrapper}>
            <Text style={styles.listTextHeader}>{node.blob.title}</Text>
            {message}
          </View>
          <View style={styles.editWrapper}>
            <TouchableOpacity
              key={i}
              onPress={() => this.editNode(node.blob, node.id)}>
              <Feather name="edit" size={26} color="gray"/>
            </TouchableOpacity>
          </View>
        </View>

      )
    }

    let i = 0;

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} onScroll={this.props.screenProps.logScrollPosition}>
          {nodes}
        </ScrollView>

      </SafeAreaView>
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
  },
  editWrapper: {
    flexShrink: 0,
    paddingTop: 5,
    flexDirection: 'row',
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
  errorContainer: {flexDirection: 'row', marginTop: 15},
  errorText: {'color': '#dc3545', flex: 1},
  removeButton: {
    backgroundColor: 'red',
    borderRadius: 4,
    flexGrow: 0,
    width: 70,
    padding: 5,
    marginRight: -24,
    marginLeft: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeButtonText: {color: '#fff', textAlign: 'center'},

});
