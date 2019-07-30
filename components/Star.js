import React from 'react';
import {Picker, View} from 'react-native';
import {Image} from "react-native";


export class Star extends React.Component {

  constructor(props) {
    super(props);
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
    if(typeof nodes !== 'object') {
      return [];
    }

    let personalCollections = [];


    for (let key in nodes) {
      if (nodes.hasOwnProperty(key)) {
        if(nodes[key].type === 'personal_collection') {
          personalCollections.push(nodes[key]);
        }
      }
    }

    return personalCollections
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
      options.unshift(<Picker.Item key={"0"} label='None' value='0' />);

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
        </View>
    )
  }
}
