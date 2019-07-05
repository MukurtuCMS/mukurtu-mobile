import React from 'react';
import {SQLite} from 'expo-sqlite';

const globalDB = SQLite.openDatabase('global');

export const createUniqueTables = (db) => {
  createTokenTable(db);
  createSyncTable(db);
  createNodesTable(db);
  createTaxonomyTable(db);
  createNodesSavedTable(db);
  createContentTypesTable(db);
  createContentTypeTable(db);
  createDisplayModesTable(db);
  createSavedOfflineTable(db);
};

export const createGlobalTables = () => {
  globalDB.transaction(tx => {
    tx.executeSql(
      'create table if not exists user (siteUrl primary key, user text);'
    );
  });
  globalDB.transaction(tx => {
    tx.executeSql(
      'create table if not exists database (siteUrl primary key, databaseName text);'
    );
  });
}

// Below are functions not being exported

const createTokenTable = (db) => {
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists auth (id integer primary key, token text, cookie text);'
    );
  });
}

const createSyncTable = (db) => {
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists sync (id integer primary key, last integer);'
    );
  });
}

const createNodesTable = (db) => {
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists nodes (nid integer primary key, title text, entity text, editable boolean);'
    );
  });
}

const createTaxonomyTable = (db) => {
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists taxonomy (tid integer primary key, title text, entity text);'
    );
  });
}

const createNodesSavedTable = (db) => {
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists nodes_saved (nid integer primary key, title text, entity text);'
    );
  });
}

const createContentTypesTable = (db) => {
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists content_types (id integer primary key, blob text);'
    );
  });
}

const createContentTypeTable = (db) => {
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists content_type (machine_name text primary key, blob text);'
    );
  });
}

const createDisplayModesTable = (db) => {
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists display_modes (machine_name text primary key, node_view text, list_view text);'
    );
  });
}

const createSavedOfflineTable = (db) => {
/*  console.log(db);
  db.transaction(tx => {
    tx.executeSql(
      'drop table if exists saved_offline;'
    );
  });*/
  db.transaction(tx => {
    tx.executeSql(
      'create table if not exists saved_offline (id integer primary key, blob text, saved boolean, error text);'
    );
  });
}