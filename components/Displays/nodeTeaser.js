import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {ScaldItem} from "../ScaldItem";
import {ParagraphView} from "../ParagraphView";
import Colors from "../../constants/Colors";
import { NavigationActions } from 'react-navigation';
import _ from 'lodash';

export default class NodeTeaser extends React.Component {

  editNode(node) {
    const navigateAction = NavigationActions.navigate({
      routeName: 'EditContentForm',
      params: {
        contentType: this.props.node.type,
        contentTypeLabel: this.props.node.title,
        node: this.props.node,
        editWord: 'Edit',
        // customBackScreen: 'NodeListing'
      },
      key: `node-edit-${this.props.node.nid}`
    });
    this.props.navigation.dispatch(navigateAction);
  }

  viewNode() {
    const navigateAction = NavigationActions.navigate({
      routeName: 'Node',
      params: {
        contentType: this.props.node.type,
        contentTypeLabel: this.props.node.title,
        node: this.props.node,
        terms: this.props.terms
      },
      key: `node-view-${this.props.node.nid}`
    });
    this.props.navigation.dispatch(navigateAction);

  }

  render() {
    const node = this.props.node;

    let body = '';
    if (node.body !== undefined) {
      body = node.body[Object.keys(node.body)[0]];
      const regex = /(<([^>]+)>)/ig;
      // let bodyValue = ((body || {})[0] || {})['value'];
      let bodyValue = _.get(body, [0, 'value'], '');
      let bodySafeValue = _.get(body, [0, 'safe_value'], '');
      // let bodySafeValue = ((body || {})[0] || {})['safe_value'];

      if (bodySafeValue.length !== 0) {
        body = bodySafeValue.replace(regex, '');
      }
      else if (bodyValue.length !== 0) {
        body = bodyValue.replace(regex, '');
      }
    }

    // Get our fields from list of viewable fields
    let viewableFields = [];
    if (this.state && this.props.viewableFields && this.props.terms && this.props.allNodes) {
      for (let [key, value] of Object.entries(this.props.viewableFields)) {
        if (typeof node[key] !== 'undefined' &&
            typeof node[key]['und'] !== 'undefined' &&
            typeof node[key]['und']['0']['sid'] !== 'undefined') {
          viewableFields.push(
            <View key={key} style={styles.view}>
              <Text style={styles.label}>{value.label}</Text>
              <ScaldItem
                token={this.props.token}
                cookie={this.props.cookie}
                url={this.props.url}
                sid={node[key]['und']['0']['sid']}
                db={this.props.db}
              />
            </View>
          )
        }
        // Node reference
        else if (typeof node[key] !== 'undefined' &&
            typeof node[key]['und'] !== 'undefined' &&
            typeof node[key]['und']['0']['nid'] !== 'undefined') {
          let refNid = node[key]['und']['0']['nid'];
          if(this.props.allNodes.length > 0) {
            let refNode = this.props.allNodes.filter(node => node.nid == refNid);

            refNode = refNode[0];

            if (typeof refNode !== 'undefined') {
              viewableFields.push(
                <View key={key + refNode.nid} style={styles.view}>
                  <Text style={styles.label}>{value.label}</Text>
                  <Text>{refNode.title}</Text>
                </View>
              )
            }
          }
        } else if (typeof node[key] !== 'undefined' &&
            typeof node[key]['und'] !== 'undefined' &&
            typeof node[key]['und']['0']['safe_value'] !== 'undefined'
        ) {
          viewableFields.push(
            <View key={key} style={styles.view}>
              <Text style={styles.label}>{value.label}</Text>
              <Text>{node[key]['und']['0']['safe_value']}</Text>
            </View>
          )
        }
        // Taxonomy terms
        else if (typeof node[key] !== 'undefined' &&
            typeof node[key]['en'] !== 'undefined'
        ) {
          let termNames = [];
          for (let i = 0; i < node[key]['en'].length; i++) {
            let tid = node[key]['en'][i]['tid'];
            if(typeof this.props.screenProps.terms[tid] !== 'undefined') {
              let termTitle = this.props.screenProps.terms[tid]['name'];
              termNames.push(termTitle);
            }
          }

          let termNamesString = termNames.join(', ');
          viewableFields.push(
            <View key={key} style={styles.view}>
              <Text style={styles.label}>{value.label}</Text>
              <Text>{termNamesString}</Text>
            </View>
          )
        }
        // Paragraph
        else if (typeof node[key] !== 'undefined' &&
            typeof node[key]['und'] !== 'undefined' &&
            typeof node[key]['und']['0']['revision_id'] !== 'undefined'
        ) {
          viewableFields.push(
            <View key={key} style={styles.view}>
              <ParagraphView
                token={this.props.token}
                cookie={this.props.cookie}
                url={this.props.url}
                pid={node[key]['und']['0']['value']}
                viewableFields={this.props.viewableFields}
                fieldName={key}
                navigation={this.props.navigation}
              />
            </View>
          )
        }

      }
    }

    let feather = null;
    let nid = this.props.node.nid;
    let editableContentTypes = this.props.editableContentTypes !== undefined ? Object.keys(this.props.editableContentTypes) : [];
    if(editableContentTypes.indexOf(this.props.node.type) > -1 && (this.props.editable[nid] === true || this.props.editable[nid] == '1')) {
      feather =(<View style={styles.nodeEditWrapper}>
        <Feather onPress={() => this.editNode()} name="edit" size={24} color="gray"/>
      </View>);
    }

    if (this.props.condensed) {
      return (<View>
        {this.props.showType && <Text style={styles.contentType}>{this.props.editableContentTypes[node.type].label}</Text>}
        <TouchableOpacity onPress={() => this.viewNode()}>
          <Text style={styles.nodeTitleCondensed}>{node.title}</Text>
        </TouchableOpacity>
      </View>);
    }


    return <View style={styles.nodeWrapper}>
      <View style={styles.nodeInnerWrapper}>
        {this.props.showType && <Text style={styles.contentType}>{this.props.editableContentTypes[node.type].label}</Text>}
        <TouchableOpacity style={styles.touchable}  onPress={() => this.viewNode()}>
          <Text style={styles.nodeTitle}>{node.title}</Text>
        </TouchableOpacity>
        <Text style={styles.nodeBody} numberOfLines={2}>{body}</Text>
        {viewableFields}
      </View>
      {feather}
    </View>;
  }
}

const styles = StyleSheet.create({
  nodeTitle: {
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flex: 1,
    color: Colors.primary
  },
  nodeTitleCondensed: {
    fontSize: 16,
    marginVertical: 2,
    // flex: 1,
    color: Colors.primary
  },
  nodeBody: {
    fontSize: 16,
    justifyContent: 'center',
    flex: 1,
    flexWrap: 'wrap'
  },
  nodeWrapper: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  nodeInnerWrapper: {
    flex: 1,
    flexDirection: 'column'
  },
  nodeEditWrapper: {
    flexShrink: 0,
    paddingTop: 5
  },
  label: {
    marginBottom: 5,
    color: '#000',
    fontWeight: 'bold'
  },
  view: {
    width: '100%',
    marginBottom: 15,
  },
  contentType: {
    textTransform: 'uppercase',
    fontSize: 12
  },
  touchable: {

  }
});
