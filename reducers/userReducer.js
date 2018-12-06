// placeReducer.js

import { ADD_USER } from '../actions/types';

const initialState = {
  user: {"user":{"uid":0}}
};

const userReducer = (state = initialState, action) => {
  switch(action.type) {
    case ADD_USER:
      return {
        user: action.payload
      };
    default:
      return state;
  }
}

export default userReducer;