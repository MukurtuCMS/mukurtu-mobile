import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { Feather }  from '@expo/vector-icons';

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
            node: this.props.node.entity
        })
    }

    render() {
        const node = this.props.node;

        let body = '';
        if (node.entity.body !== undefined) {
            body = node.entity.body[Object.keys(node.entity.body)[0]];
            const regex = /(<([^>]+)>)/ig;
            if(typeof body !== 'undefined') {
                body = body[0]['safe_value'].replace(regex, '');
            }
        }
        return <View style={styles.nodeWrapper}>
            <View style={styles.nodeInnerWrapper}>
                <Text style={styles.nodeTitle} onPress={() => this.viewNode()}>{node.title}</Text>
                <Text style={styles.nodeBody} numberOfLines={2}>{body}</Text>
            </View>
            <View style={styles.nodeEditWrapper}>
                <Feather onPress={() => this.editNode()} name="edit" size={24} color="gray" />
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