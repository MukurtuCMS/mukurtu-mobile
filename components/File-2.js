import React                                  from 'react'
import { TextField }                          from 'react-native-material-textfield'
import { TouchableOpacity, View, Button }     from 'react-native'
import t                                      from 'tcomb-form-native/lib'
import { DocumentPicker, FileSystem } from 'expo';

const { Component } = t.form

class FilesNotSanitized extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    const { error2 } = this.state

    return super.shouldComponentUpdate(nextProps, nextState)
      || nextState.error2 !== error2
  }

  getTemplate() {
    const { disabled, style } = this.props.options // eslint-disable-line
    const { error2: { message } = {} } = this.state

    return ({ error, hasError, help, label,
      stylesheet: { button: { backgroundColor }, formGroup }, value = [] }) => (
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
              value={value.map(({ name }) => name).join(', ')}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  _onPress = async () => {
    let fileObject = {};
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
    });
    if (result.type === 'cancel') return;
    fileObject.name = result.name;
    // console.log('uri', result.uri);
    try {
/*      const info = await FileSystem.getInfoAsync(result.uri);
      // this.setState({ data: info });
      console.warn('info', info);*/
      const content = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingTypes.Base64,
      });
      fileObject.blob = content;
      // this.setState({ data: content });
    } catch (e) {
      console.warn(e.message);
    }
    this.setState({value: fileObject});

  }

}

FilesNotSanitized.transformer =
  {
    format(value) {
      console.log(value);
      return value || []
    },

    parse(files) {
      return files || []
    },
  }

class FilesSanitizied extends FilesNotSanitized {

  getValue() {
    this.setState({ error2: undefined })

    try {
      return super.getValue()
    } catch (e) {
      this.setState({ error2: new Error('File names can only have ASCII chars') })
      return null
    }
  }

}
FilesSanitizied.transformer =
  {
    format: FilesNotSanitized.transformer.format,

    parse(files) {
      files = FilesNotSanitized.transformer.parse(files)

      return Array.prototype.map.call(files, file => ({ ...file, name: encodeURIComponent(file.name) }))
    },
  }

// ReactNative `FormData` has a non-standard `getParts()` method
const needsSanitizied = typeof FormData.prototype.getParts !== 'undefined'
const Files = needsSanitizied ? FilesSanitizied : FilesNotSanitized

export default Files
