import React from 'react'
import {Linking, Text, TouchableOpacity, StyleSheet} from "react-native";
import {get, has} from 'lodash';
import {NavigationActions} from "react-navigation";
import Colors from "../constants/Colors";

export default function Link({link, navigation, nodes, terms}) {

  const inAppLink = get(link, ['attributes', 'muk-app'], false);
  let nid = null;



  if (inAppLink) {
    const linkParts = link.url.split('/');
    nid = linkParts.slice(-1)[0];
    if (!has(nodes, [nid])) {
      return null;
    }
  }

  const onLinkPress = () => {
    if (nid != null) {
      const navigateAction = NavigationActions.navigate({
        routeName: 'Node',
        params: {
          contentType: nodes[nid].type,
          contentTypeLabel: nodes[nid].title,
          node: nodes[nid],
          terms: terms
        },
        key: `node-view-${nid}`
      });
      navigation.dispatch(navigateAction);
    }
    else {
      Linking.openURL(link.url);
    }
  }

  return (<TouchableOpacity onPress={onLinkPress}>
    <Text style={styles.nodeTitle}>{link.title}</Text>
  </TouchableOpacity>);
}

const styles = StyleSheet.create({
  nodeTitle: {
    fontSize: 16,
    marginBottom: 3,
    color: Colors.primary
  },
})

