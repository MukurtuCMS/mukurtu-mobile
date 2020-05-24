import React from 'react'
import * as ScreenOrientation from 'expo-screen-orientation';
import {NavigationEvents} from 'react-navigation';

export default function UnlockOrientation() {
  return (
    <NavigationEvents
      onDidFocus={async () => {
        await ScreenOrientation.unlockAsync()
      }}
      onDidBlur={async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }}
    />
  )
}
