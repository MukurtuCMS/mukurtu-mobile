import React from 'react';
import {HeaderBackButton} from 'react-navigation-stack';

/**
 * When editing a node from the node listing screen, we want the back button to go back to the node listing screen,
 * not the create content screen.
 */
export default class CustomBackButton extends React.Component {


  backFunction() {
    if (typeof this.props.navigation.getParam('customBackScreen') === 'string') {
      let route = this.props.navigation.getParam('customBackScreen');
      this.props.navigation.navigate(route);
    } else {
      this.props.navigation.goBack();
    }
  }

  render() {
    return <HeaderBackButton
      onPress={() => {
        this.backFunction()
      }}
      tintColor='black'
    />;
  }
}
