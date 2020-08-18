import React, {useEffect, useMemo, useState} from 'react'
import PropTypes from 'prop-types'
import {ScrollView, Text, View, StyleSheet, SafeAreaView} from "react-native";
import _ from 'lodash';
import NodeTeaser from "../components/Displays/nodeTeaser";

export default function CategoryScreen({navigation, screenProps}) {
  const [label, setLabel] = useState('');
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState({tid: null, field: null});

  useEffect(() => {
    const type = navigation.getParam('type');
    const field = navigation.getParam('field');
    const tid = navigation.getParam('tid');

    const label = _.get(screenProps, ['displayModes', type, field, 'label'], 'Term');
    const title = _.get(screenProps, ['terms', tid, 'name'], '');
    navigation.setParams({name: `${label}: ${title}`})

    setLabel(label);
    setTitle(title);
    setFilter({tid, field});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    if (filter.tid === null) {
      return [];
    }
    return _.filter(screenProps.nodes, (node) => {
      const field = _.get(node, filter.field);
      if (field === undefined || field.length === 0) {
        return false;
      }
      const lang = _.has(field, 'en') ? 'en' : 'und';

      const result = _.find(field[lang], {'tid': filter.tid})

      return result !== undefined
    });
  }, [screenProps.refreshing, filter]); // eslint-disable-line react-hooks/exhaustive-deps


  if (list.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No other content synced to the device for</Text>
        <Text>{label}: {title}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView style={styles.container} onScroll={screenProps.logScrollPosition}>
        {list.map((item) =>
          <NodeTeaser
            showType={true}
            key={item.nid}
            node={item}
            token={screenProps.token}
            cookie={screenProps.cookie}
            url={screenProps.siteUrl}
            db={screenProps.db}
            terms={screenProps.terms}
            allNodes={screenProps.nodes}
            navigation={navigation}
            editable={screenProps.editable}
            editableContentTypes={screenProps.contentTypes}
          />)}
      </ScrollView>
    </SafeAreaView>
  )
}

CategoryScreen.propTypes = {
  navigation: PropTypes.object,
  screenProps: PropTypes.object
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15}
})
