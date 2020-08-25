import React, {useState} from 'react'
import TeaserView from "../TeaserView";
import PropTypes from 'prop-types'
import {NavigationActions} from "react-navigation";
import {get, has} from 'lodash';
import * as FileSystem from "expo-file-system";

export default function TeaserDisplay({node, navigation, editableContentTypes, terms, db}) {
  const [imageUrl, setImageUrl] = useState('');
  let sid = null;
  let icon = '';
  let meta = [];

  const viewNode = () => {
    const navigateAction = NavigationActions.navigate({
      routeName: 'Node',
      params: {
        contentType: node.type,
        contentTypeLabel: node.title,
        node: node,
        terms: terms
      },
      key: `node-view-${node.nid}`
    });
    navigation.dispatch(navigateAction);
  }

  const loadImage = (sid) => {
    if (sid != null) {
      db.transaction(tx => {
        tx.executeSql(
          'select * from atom where sid = ?',
          [sid],
          (success, atoms) => {
            const atom = atoms.rows._array[0];
            if (atom === undefined) {
              return;
            }
            const atomEntity = JSON.parse(atom.entity);
            if (atomEntity.type !== 'image') {
              return;
            }

            let sanitizedFileName = atom.title.replace(/ /g,"_");
            if (has(atomEntity, ['base_entity', 'filename'])) {
              sanitizedFileName = atomEntity.base_entity.filename.replace(/ /g,"_");
            }
            setImageUrl(FileSystem.documentDirectory + sanitizedFileName);
          }
        )
      });
    }
  }

  const type = editableContentTypes[node.type].label;

  switch (node.type) {
    case 'collection':
      icon = 'folder-plus';
      sid = get(node, ['field_collection_image', 'und', 0, 'sid'], null);
      loadImage(sid);
      break;
    case 'dictionary_word':
      icon = 'book-open';
      break;
    case 'digital_heritage':
      icon = 'feather';
      sid = get(node, ['field_media_asset', 'und', 0, 'sid'], null);
      loadImage(sid);
      meta = [{title: 'Community', value: 'Community 1'}, {title: 'Category', value: 'General, Historic, Photographs'}]
      break;
    case 'person':
      icon = 'user';
      sid = get(node, ['field_media_asset', 'und', 0, 'sid'], null);
      loadImage(sid);
      break;
    case 'word_list': {
      console.log(node.field_collection_summary);
      icon = 'list';
      sid = get(node, ['field_collection_image', 'und', 0, 'sid'], null);
      loadImage(sid);
      const wordCount = get(node, ['field_words', 'und'], []).length;
      meta = [{value: `${wordCount} word` + (wordCount !== 1 ? 's' : '')}];
      const summary = get(node, ['field_collection_summary', 'und', 0, 'value'], '');
      if (summary.length > 0) {
        meta.push({title: 'Summary', value: summary});
      }
      break;
    }
  }

  return <TeaserView
    onClick={viewNode}
    type={type}
    title={node.title}
    image={imageUrl}
    icon={icon}
    meta={meta}
  />
}

TeaserDisplay.propTypes = {
  node: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
  editableContentTypes: PropTypes.object.isRequired,
  terms: PropTypes.object.isRequired
}