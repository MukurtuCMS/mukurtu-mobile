import React from 'react';
import {TextInput, View, Text, StyleSheet} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {ScaldItem} from "../ScaldItem";
import {ParagraphView} from "../ParagraphView";

export default class NodeTeaser extends React.Component {

  editNode(node) {
    this.props.navigation.navigate('CreateContentForm', {
      contentType: this.props.node.entity.type,
      contentTypeLabel: this.props.node.entity.title,
      node: this.props.node.entity
    })
  }

  viewNode() {
    this.props.navigation.navigate('Node', {
      contentType: this.props.node.entity.type,
      contentTypeLabel: this.props.node.entity.title,
      node: this.props.node.entity,
      terms: this.state.terms
    })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.viewableFields !== prevProps.viewableFields) {
      this.setState({'viewableFields': this.props.viewableFields});
    }
    if (this.props.terms !== prevProps.terms) {
      this.setState({'terms': this.props.terms});
    }
  }


  render() {
    const node = this.props.node;

    let body = '';
    if (node.entity.body !== undefined) {
      body = node.entity.body[Object.keys(node.entity.body)[0]];
      const regex = /(<([^>]+)>)/ig;
      if (typeof body !== 'undefined') {
        body = body[0]['safe_value'].replace(regex, '');
      }
    }

    // Get our fields from list of viewable fields
    let viewableFields = [];
    if (this.state && this.state.viewableFields && this.state.terms && this.props.allNodes) {
      for (let [key, value] of Object.entries(this.state.viewableFields)) {
        if (typeof node.entity[key] !== 'undefined' &&
            typeof node.entity[key]['und'] !== 'undefined' &&
            typeof node.entity[key]['und']['0']['sid'] !== 'undefined') {
          viewableFields.push(
              <View>
                <Text>{value.label}</Text>
                <ScaldItem
                    token={this.props.token}
                    cookie={this.props.cookie}
                    url={this.props.url}
                    sid={node.entity[key]['und']['0']['sid']}
                    db={this.props.db}
                />
              </View>
          )
        }
        // Node reference
        else if (typeof node.entity[key] !== 'undefined' &&
            typeof node.entity[key]['und'] !== 'undefined' &&
            typeof node.entity[key]['und']['0']['nid'] !== 'undefined') {
          let refNid = node.entity[key]['und']['0']['nid'];
          let refNode = this.props.allNodes.filter(node => node.nid == refNid);

          viewableFields.push(
              <View>
                <Text>{value.label}</Text>
                <Text>{refNode.title}</Text>
              </View>
          )
        } else if (typeof node.entity[key] !== 'undefined' &&
            typeof node.entity[key]['und'] !== 'undefined' &&
            typeof node.entity[key]['und']['0']['safe_value'] !== 'undefined'
        ) {
          viewableFields.push(
              <View>
                <Text>{value.label}</Text>
                <Text>{node.entity[key]['und']['0']['safe_value']}</Text>
              </View>
          )
        }
        // Taxonomy terms
        else if (typeof node.entity[key] !== 'undefined' &&
            typeof node.entity[key]['en'] !== 'undefined'
        ) {
          for (let i = 0; i < node.entity[key]['en'].length; i++) {
            let tid = node.entity[key]['en'][i]['tid'];
            let termTitle = this.state.terms[tid]['name'];
            viewableFields.push(
                <View>
                  <Text>{value.label}</Text>
                  <Text>{termTitle}</Text>
                </View>
            )
          }
        }
        // Paragraph
        else if (typeof node.entity[key] !== 'undefined' &&
            typeof node.entity[key]['und'] !== 'undefined' &&
            typeof node.entity[key]['und']['0']['revision_id'] !== 'undefined'
        ) {
          viewableFields.push(
              <View>
                <ParagraphView
                    token={this.props.token}
                    cookie={this.props.cookie}
                    url={this.props.url}
                    pid={node.entity[key]['und']['0']['value']}
                    viewableFields={this.state.viewableFields}
                    fieldName={key}
                />
              </View>
          )
        }

      }
    }

    return <View style={styles.nodeWrapper}>
      <View style={styles.nodeInnerWrapper}>
        <Text style={styles.nodeTitle} onPress={() => this.viewNode()}>{node.title}</Text>
        <Text style={styles.nodeBody} numberOfLines={2}>{body}</Text>
        {viewableFields}
      </View>
      <View style={styles.nodeEditWrapper}>
        <Feather onPress={() => this.editNode()} name="edit" size={24} color="gray"/>
      </View>
    </View>;
  }
}

const styles = StyleSheet.create({
  nodeTitle: {
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flex: 1
  },
  nodeBody: {
    fontSize: 16,
    justifyContent: 'center',
    flex: 1
  },
  nodeWrapper: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  nodeInnerWrapper: {
    flex: 1,
    flexDirection: 'column',
    flexWrap: 'wrap',
  },
  nodeEditWrapper: {
    flexShrink: 0,
    paddingTop: 5
  }
});