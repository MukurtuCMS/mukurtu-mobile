import React from 'react'
import {StyleSheet, Text, View} from "react-native";
import _ from 'lodash';
import NodeTeaser from "./Displays/nodeTeaser";

export default function MicroTask({screenProps, taskId, navigation}) {
  const {fieldCollectionsData} = screenProps;

  if(fieldCollectionsData[taskId] === undefined) {
    return null;
  }

  let task = _.get(fieldCollectionsData, [taskId, 'field_task', 'und', 0, 'safe_value'], null);
  if (task !== null) {
    task = <Text style={styles.spacer}><Text style={styles.label}>Task: </Text>{task}</Text>
  }

  let keyStudentOutcomes = _.get(fieldCollectionsData, [taskId, 'field_key_student_outcomes', 'und', 0, 'safe_value'], null);
  if (keyStudentOutcomes !== null) {
    keyStudentOutcomes = <Text style={styles.spacer}><Text style={styles.label}>Key Student Outcomes: </Text>{keyStudentOutcomes}</Text>
  }

  let relatedContent = [];
  const targetIds = _.get(fieldCollectionsData, [taskId, 'field_related_content', 'und'], []);
  targetIds.map((value, index) => {
    relatedContent.push(
      <NodeTeaser
        condensed={true}
        key={`micro_task_rc_${index}`}
        node={screenProps.nodes[value.target_id]}
        token={screenProps.token}
        cookie={screenProps.cookie}
        url={screenProps.siteUrl}
        db={screenProps.db}
        terms={screenProps.terms}
        allNodes={screenProps.nodes}
        navigation={navigation}
        editable={false}
        editableContentTypes={screenProps.contentTypes}/>
    );
  })


  return (
    <View style={styles.container}>
      {task}
      {keyStudentOutcomes}
      {relatedContent.length > 0 && <Text style={styles.label}>Related Content:</Text> }
      {relatedContent}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  spacer: {
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold'
  }
})
