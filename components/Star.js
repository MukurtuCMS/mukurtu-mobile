import React from 'react';
import {Picker, View} from 'react-native';
import {Image} from "react-native";
import {Button} from "react-native-elements";


export class Star extends React.Component {

  constructor(props) {
    super(props);
    this.saveNode = this.saveNode.bind(this);
    this.state = {
      collectionSelected: 0
    }
  }


  /**
   * Get synced personal collections
   * @returns {Array}
   */
  getPersonalCollections() {
    let nodes = this.props.nodes;
    // Filter our synced node list to get just personal collections
    if (typeof nodes !== 'object') {
      return [];
    }

    let personalCollections = [];


    for (let key in nodes) {
      if (nodes.hasOwnProperty(key)) {
        if (nodes[key].type === 'personal_collection') {
          personalCollections.push(nodes[key]);
        }
      }
    }

    return personalCollections
  }


  /**
   * Modified version of the saveNode function in form.js
   * Should probably be refactored to be one function at some point
   */
  saveNode() {

    // Create a form values array for currentNid so we can submit it.
    let personalCollectionsNew = this.getPersonalCollections();

    // Get the array for the current personal collection, alter it with our new values
    let personalCollectionArray = personalCollectionsNew.filter(item => item.nid === this.state.collectionSelected);

    personalCollectionArray = personalCollectionArray[0];

    // Update with new value. This doesn't check for existing ones yet
    personalCollectionArray.field_digital_heritage_items = {
      'und': {
        '0': {
          'target_id': this.props.nid
        }
      }
    };

    // The required personal collection privacy field has an incorrect structure, which we need to fix
    let val = personalCollectionArray.field_personal_coll_privacy['und']['0']['value'];

    personalCollectionArray.field_personal_coll_privacy = {
      'und': {
        'value': val
      }
    };

    let submissionArray = personalCollectionArray;


    if (!this.props.isConnected) {
      this.props.db.transaction(
          tx => {
            tx.executeSql('insert into saved_offline (blob, saved) values (?, 0)',
                [JSON.stringify(submissionArray)],
                function (t) {
                  let a;
                  console.log(t);
                },
                function (e, t) {
                  let v;
                  console.log(e);
                  console.log(t);
                }
            );
          }
      );
    } else {


      // I have to do this right now because I am getting errors trying to use the postData method
      const token = this.props.token;
      const cookie = this.props.cookie;
      const data = {
        method: 'PUT',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
          'Cookie': cookie
        },
        redirect: 'follow',
        referrer: 'no-referrer',
        body: JSON.stringify(submissionArray)
      };

      fetch(this.props.url + '/app/node/' + this.state.collectionSelected + '.json', data,
          )
          .then((response) => response.json())
          .then((responseJson) => {
            if (responseJson.form_errors) {
              console.log(responseJson.form_errors)
            }
          })
          .catch((error) => {
            console.error(error);
          });
    }
  }


  render() {


    // Create select menu for personalCollections
    let personalCollections = this.getPersonalCollections();


    let collectionList = [];

    let options = personalCollections.map(collection => {
      return (<Picker.Item
          key={collection.nid}
          label={collection.title}
          value={collection.nid}
      />);
    });

    // Add none option
    options.unshift(<Picker.Item key={"0"} label='None' value='0'/>);

    collectionList.push(
        <Picker
            key={"0"}
            selectedValue={this.state.collectionSelected}
            // style={styles.picker}
            // itemStyle={styles.pickerItem}
            onValueChange={(itemValue, itemIndex) =>
                this.setState({collectionSelected: itemValue})
            }>
          {options}
        </Picker>
    );


    // React native won't let you use a variable for require (require statements are resolved at bundle time)
    // So we have to get both images and then decide which one to show. Hence this bit of repetition
    let outline = <Image
        style={{width: 40, height: 40}}
        source={require('../assets/images/star-outline.png')}
    />;

    let solid = <Image
        style={{width: 40, height: 40}}
        source={require('../assets/images/star-solid.png')}
    />;


    let image = outline;
    if (this.props.starred) {
      image = solid;
    }

    return (
        <View>
          {image}
          {collectionList}
          <Button
              title="Submit"
              onPress={this.saveNode}
          />
        </View>
    )
  }
}
