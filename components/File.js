import React from 'react'
import {TextField} from 'react-native-material-textfield'
import t from 'tcomb-form-native/lib'
import {DocumentPicker} from 'expo';
import {
  View,
  Button,
  TouchableOpacity
} from 'react-native';

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

export default DocumentPickerFactory;