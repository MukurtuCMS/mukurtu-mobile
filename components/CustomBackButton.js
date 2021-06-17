import React from 'react';
import { Alert } from "react-native";
import {HeaderBackButton} from 'react-navigation-stack';

/**
 * When editing a node from the node listing screen, we want the back button to go back to the node listing screen,
 * not the create content screen.
 */
export default class CustomBackButton extends React.Component {

  unsavedEditFormAlert() {
    const routeName = this.props.navigation.state["routeName"];

    // Fail to normal back button behavior if we have no route.
    if (routeName === undefined) {
      this.backFunction();
      return;
    }

    // If we do have a route, use normal back button behavior
    // if we're not on the edit/create form.
    if (routeName != "EditContentForm" && routeName != "CreateContentForm") {
      this.backFunction();
      return;
    }

    // Display the unsaved changes alert.
    Alert.alert(
    "Discard unsaved changes?",
    "Leaving this form will discard any unsaved changes.",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      { text: "Discard", onPress: () => this.backFunction() }
    ]
  )};

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
        //this.unsavedEditFormAlert();
        this.backFunction()
      }}
      tintColor='black'
    />;
  }
}
