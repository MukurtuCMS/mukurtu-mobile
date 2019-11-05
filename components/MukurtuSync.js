import React from 'react';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

export const Sync = () => {

};



export const syncContentTypes = (state, complete) => {
  let returnData = 'failure';
  const data = buildFetchData('GET', state);
  getCreatableTypes(state, data, complete);

  // Now let's do the same thing for the display modes
  fetch(state.siteUrl + '/app/viewable-types/retrieve', data)
      .then((response) => response.json())
      .then((responseJson) => {
        if (typeof responseJson === 'object' && responseJson !== null) {

          // now let's sync all content type display endpoints
          for (const [machineName, TypeObject] of Object.entries(responseJson)) {
            fetch(state.siteUrl + '/app/node-view-fields/retrieve/' + machineName, data)
                .then((response) => response.json())
                .then((responseJson) => {
                  returnData = 'success';

                  state.db.transaction(
                      tx => {
                        tx.executeSql('replace into display_modes (machine_name, node_view) values (?, ?)',
                            [machineName, JSON.stringify(responseJson)],
                            (success) => '',
                            (success, error) => ''
                        );
                      }
                  );

                  // @todo: We will need to grab the listing display as well
                })
                .catch((error) => {
                  returnData = 'failure';
                });
          }
        }
      })
      .catch((error) => {
        returnData = 'failure';
      });
  return returnData;
}

const getCreatableTypes = async (state, data, complete) => {
  fetch(state.siteUrl + '/app/creatable-types/retrieve', data)
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson[0] && responseJson[0] === 'Access denied for user anonymous') {
          console.log('access denied');
        }
        if (typeof responseJson === 'object' && responseJson !== null) {
          state.db.transaction(
              tx => {
                tx.executeSql('delete from content_types;',
                );
              }
          );
          state.db.transaction(
              tx => {
                tx.executeSql('insert into content_types (id, blob) values (?, ?)',
                    [1, JSON.stringify(responseJson)],
                    (success) => '',
                    (success, error) => console.log(' ')
                );
              }
          );

          // now let's sync all content type endpoints
          let urls = [];
          for (const [machineName, TypeObject] of Object.entries(responseJson)) {
            urls.push({url: state.siteUrl + '/app/node-form-fields/retrieve/' + machineName, machineName: machineName});
          }
          Promise.all(urls.map(url =>
              fetch(url.url, data)
                  .then(checkStatus)
                  .then(parseJSON)
                  .then((response) => insertContentType(response, state, url.machineName))
                  .catch(error => console.log(error))
          ))
              .then(data => {
                // complete(true);
              })
        }
      })
}

const checkStatus = (response) => {
  if (response.ok) {
    return Promise.resolve(response);
  } else {
    return Promise.reject(new Error(response.statusText));
  }
}

const parseJSON = (response) => {
  return response.json();
}

const insertContentType = (response, state, machineName) => {
  state.db.transaction(
      tx => {
        tx.executeSql('insert into content_type (machine_name, blob) values (?, ?)',
            [machineName, JSON.stringify(response)],
            (success) => () => {
              return 'success'
            },
            (success, error) => ''
        );
      }
  );
  return response;

}

// The rest of these functions are not exported

const getToken = (array, state) => {
  if (array === undefined || array.length < 1) {
    return false;
  }

  const token = state.token;
  const cookie = state.cookie;

  let data = buildFetchData('GET', state);


  fetch(state.siteUrl + '/app/synced-entities/retrieve', data)
      .then((response) => response.json())
      .then((responseJson) => {
        if (typeof responseJson.nodes === 'object') {
          let nodes = {};
          for (const [type, entity] of Object.entries(responseJson.nodes)) {
            if (typeof responseJson.nodes[type] === 'object') {
              for (const [nid, object] of Object.entries(responseJson.nodes[type])) {
                if (typeof responseJson.nodes[type] === 'object') {
                  nodes[nid] = object;
                }
              }
            }
          }
          buildRemovalNids(nodes, state);
          for (const [nid, object] of Object.entries(nodes)) {
            // @todo don't update all nodes but starring a node does not save
            // if (timestamp > this.state.syncUpdated) {
            saveNode(nid, data, object.editable, state);
            // }
          }

          // now lets sync the taxonomy terms as well
        }
        if (typeof responseJson.terms === 'object') {
          for (const [tid, object] of Object.entries(responseJson.terms)) {
            // @todo don't update all nodes but starring a node does not save
            // if (timestamp > this.state.syncUpdated) {
            saveTaxonomy(tid, data, state);
            // }
          }
        }
        if (typeof responseJson.atoms === 'object') {
          for (const [sid, object] of Object.entries(responseJson.atoms)) {
            // @todo don't update all nodes but starring a node does not save
            // if (timestamp > this.state.syncUpdated) {
            saveAtom(sid, data, state);
            // }
          }
        }
        updateSync(state);
      })
      .catch((error) => {
        console.error(error);
      });
}

const buildFetchData = (method = 'GET', state) => {
  const token = state.token;
  const cookie = state.cookie;
  const data = {
    method: method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': token,
      'Cookie': cookie,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': 0
    }
  };
  return data;
}

const saveNode = (nid, data, editable, state) => {
  fetch(state.siteUrl + '/app/node/' + nid + '.json', data)
      .then((response) => response.json())
      .then((node) => {
        state.db.transaction(tx => {
          tx.executeSql(
              'delete from nodes where nid = ?;',
              [node.nid],
              (_, {rows: {_array}}) => ''
          );
        });

        state.db.transaction(
            tx => {
              tx.executeSql('insert into nodes (nid, title, entity, editable) values (?, ?, ?, ?)',
                  [node.nid, node.title, JSON.stringify(node), editable],
                  (success) => success,
                  (success, error) => ''
              );
            }
        );
      })
      .catch((error) => {
        console.error(error);
      });
}

const saveTaxonomy = (tid, data, state) => {
  fetch(state.siteUrl + '/app/tax-term/' + tid + '.json', data)
      .then((response) => response.json())
      .then((term) => {

        state.db.transaction(
            tx => {
              tx.executeSql('replace into taxonomy (tid, title, entity) values (?, ?, ?)',
                  [term.tid, term.name, JSON.stringify(term)],
                  (success) => success,
                  (success, error) => ''
              );
            }
        );
      })
      .catch((error) => {
        console.error(error);
      });
}

const saveAtom = (sid, data, state) => {
  fetch(state.siteUrl + '/app/scald/retrieve/' + sid + '.json', data)
      .then((response) => response.json())
      .then((atom) => {

        state.db.transaction(
            tx => {
              tx.executeSql('replace into atom (sid, title, entity) values (?, ?, ?)',
                  [atom.sid, atom.title, JSON.stringify(atom)],
                  (success) => success,
                  (success, error) => ''
              );
            }
        );


        if (atom.base_entity && atom.base_entity.fid) {
          const fid = atom.base_entity.fid;
          // now grab file blob and save to filesystem
          fetch(state.siteUrl + '/app/file/' + fid + '.json', data)
              .then((response) => response.json())
              .then(async (file) => {

                // It appears that sometimes the payload is too large on these, which we'll probably have to address.
                // In the meantime catching the error so it doesn't error out the app.
                try {
                  const savedFile = await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + file.filename, file.file);
                } catch (error) {
                  console.log(error);
                }

              })
              .catch((error) => {
                console.error(error);
              });
        }
      })
      .catch((error) => {
        console.error(error);
      });
}

const buildRemovalNids = (nids, state) => {
  state.db.transaction(tx => {
    tx.executeSql(
        'select nid from nodes;',
        '',
        (_, {rows: {_array}}) => removeNids(_array, nids, state)
    );
  });
}

const removeNids = (currentNids, newNids, state) => {
  for (var i = 0; i < currentNids.length; i++) {
    var currentlyStarred = false;
    for (const [nid, timestamp] of Object.entries(newNids)) {
      if (currentNids[i].nid == nid) {
        currentlyStarred = true;
      }
    }
    if (!(currentlyStarred)) {
      var currentNid = currentNids[i].nid;
      state.db.transaction(tx => {
        tx.executeSql(
            'delete from nodes where nid = ?;',
            [currentNid],
            (_, {rows: {_array}}) => console.log('')
        );
      });
    }
  }
}

const updateSync = (state) => {
  const time = new Date().getTime()
  state.db.transaction(
      tx => {
        tx.executeSql('delete from sync;',
        );
      }
  );
  state.db.transaction(
      tx => {
        tx.executeSql('insert into sync (id, last) values (?, ?)',
            [1, time],
            (success) => success,
            (success, error) => ''
        );
      }
  );
}

export const getSavedOffline = (state) => {
  return new Promise((resolve, reject) => {
    state.db.transaction(
        tx => {
          tx.executeSql(
              'select * from saved_offline;',
              '',
              (_, {rows: {_array}}) => resolve(_array)
          );
        }, null, null);
  });
}

export const syncSiteInfo = (state) => {
  const data = buildFetchData('GET', state);
  fetch(state.siteUrl + '/app/site-info/retrieve', data)
    .then((response) => response.json())
    .then((siteInfo) => {
      if (siteInfo && siteInfo.site_name) {

          state.db.transaction(
            tx => {
              tx.executeSql('replace into site_info (site_name, mobile_enabled, logo) values (?, ?, ?)',
                [siteInfo.site_name, siteInfo.mukurtu_mobile_enabled, siteInfo.logo],
                (success) => '',
                (success, error) => ''
              );
            }
          );
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
