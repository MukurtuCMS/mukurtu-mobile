import React                                  from 'react'
import { TextField }                          from 'react-native-material-textfield'
// import { TouchableOpacity, View, Button }     from 'react-native'
import t                                      from 'tcomb-form-native/lib'
import { DocumentPicker, FileSystem } from 'expo';
import {
  ActionSheetIOS,
  View,
  Text,
  Button,
  Animated,
  StyleSheet,
  Platform,
  TouchableOpacity
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
// import t from 'tcomb-form-native';
import BottomSheet from 'react-native-js-bottom-sheet';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = {
  title: string
};
type State = {
  image: ?string
};

const Component = t.form.Component;

class DocumentPickerFactory extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      file: []
    };
  }

  _onPress = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
    });
    if (result.type === 'cancel') return;

    this.setState({file: result});
    super.getLocals().onChange(result.uri);
  };

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return true;
  }

  getTemplate() {
    const { disabled, style } = this.props.options // eslint-disable-line
    const { error2: { message } = {} } = this.state
    let name = this.state.file.name || '';
    return ({ error, hasError, help, label,
      stylesheet: { button: { backgroundColor }, formGroup } }) => (
      <View style={[
        hasError ? formGroup.error : formGroup.normal,
        { flexDirection: 'row' },
        style,
      ]}
      >
        <View style={{ marginRight: 10 }}>
          <Button
            accessibilityLabel={help}
            color={backgroundColor}
            disabled={disabled}
            title={label}
            onPress={this._onPress}
          />
        </View>
        <View style={{ flexGrow: 1 }}>
          <TouchableOpacity onPress={this._onPress}>
            <TextField
              disabled={disabled}
              editable={false}
              error={hasError ? error : message}
              label=""
              labelHeight={0}
              tintColor={backgroundColor}
              title={help}
              value={name}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}


const styles = StyleSheet.create({
  topContainer: {
    overflow: 'hidden',
    borderRadius: 4,
    marginBottom: 12,
    height: 150,
    borderColor: 'grey',
    borderWidth: 1
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e6e6',
    height: 100,
    borderRadius: 4
  },
  icon: {
    textAlign: 'center',
    textAlignVertical: 'center'
  },
  image: {
    height: 150
  }
});

export default DocumentPickerFactory;