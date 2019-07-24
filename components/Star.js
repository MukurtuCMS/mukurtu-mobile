import React from 'react';
import {View} from 'react-native';
import {Image} from "react-native";


export class Star extends React.Component {

  constructor(props) {
    super(props);
  }


  render() {

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
        </View>
    )
  }
}
