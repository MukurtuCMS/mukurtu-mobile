import React from 'react'
import PropTypes from 'prop-types'
import {Dimensions, Linking} from "react-native";
import HTML from "react-native-render-html";
import {get, has} from 'lodash';
import {NavigationActions} from "react-navigation";

export default function TextArea({html, navigation, nodes, terms}) {

  const viewNode = (node = null, fallback = '') => {
    let navigateAction;

    if (node != null) {
      navigateAction = NavigationActions.navigate({
        routeName: 'Node',
        params: {
          contentType: node.type,
          contentTypeLabel: node.title,
          node: node,
          terms: terms
        },
        key: `node-view-${node.nid}`
      });
    }
    else {
      navigateAction = NavigationActions.navigate({
        routeName: 'Webview',
        params: {
          path: fallback
        }
      });
    }

    navigation.dispatch(navigateAction);
  }

  const onLinkPress = (event, url, obj) => {
    const linkClass = get(obj, ['class']);
    if (linkClass !== undefined && linkClass === 'muk-app') {
      const linkParts = url.split('/');
      const nid = linkParts.slice(-1)[0];
      if (has(nodes, [nid])) {
        viewNode(nodes[nid])
      }
      else {
        viewNode(null, url)
      }
    }
    else {
      Linking.openURL(url);
    }
  }

  const tagsStyles = {p: {marginTop: 0}};
  return (
    <HTML
      tagsStyles={tagsStyles}
      html={html}
      imagesMaxWidth={Dimensions.get('window').width}
      onLinkPress={onLinkPress}/>
  )
}

TextArea.propTypes = {

}
