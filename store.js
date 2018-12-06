// store.js

import { createStore, combineReducers } from 'redux';
import placeReducer from './reducers/placeReducer';
import userReducer from './reducers/userReducer';

const rootReducer = combineReducers({
  places: placeReducer,
  user: userReducer
});

const configureStore = () => {
  return createStore(rootReducer);
}

export default configureStore;