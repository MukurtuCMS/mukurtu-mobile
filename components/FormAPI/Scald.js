import React from 'react';
import { Image, Picker, View, Text, StyleSheet, Button } from 'react-native';
import { DocumentPicker, ImagePicker, Permissions, Constants } from 'expo';

export default class Scald extends React.Component {

    state = {
        chosenImage: null,
        takenImage:null,
        chosenDocument:null
    }
    _launchDocumentAsync =async ()=>{
        let result = await DocumentPicker.getDocumentAsync({});
        alert(result.uri);
        this.setState({chosenDocument: result, chosenImage: null, takenImage: null});
        console.log(result);
    }
    _launchCameraRollAsync =async ()=>{
        let {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL);
        if(status !== 'granted'){
            console.error('Camera not granted')
            return
        }
        let image = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: false,
            aspect: [4, 3],
            exif:true,
        })
        this.setState({chosenImage: image, takenImage: null, chosenDocument: null})
    }
    _launchCameraAsync =async()=>{
        let {status} = Permissions.askAsync(Permissions.CAMERA, Permissions.CAMERA_ROLL)
        if(status !== 'granted'){
            console.log("Camera permission Denied")
        }
        let image = await ImagePicker.launchCameraAsync()
        this.setState({takenImage: image, chosenImage: null, chosenDocument: null})


    }
    removeFile = () =>{
        this.setState({chosenImage: null, takenImage: null, chosenDocument: null})
    }
    render() {
        const field = this.props.field;
        let chosenDocumentText = "Select document";
        let chosenImageText = "Select image";
        let takenImageText = "Take photo";
        let removeFileText = "Remove Image";
        let showRemoveFile = false;
        if (this.state.chosenDocument) {
            chosenDocumentText = "Select a different document";
        }
        if (this.state.chosenImage) {
            chosenImageText = "Select a different image";
        }
        if (this.state.takenImage) {
            takenImageText = "Take a different photo";
        }
        if (this.state.chosenDocument) {
            removeFileText = "Remove Document";
        }

        if (this.state.chosenDocument || this.state.chosenImage || this.state.takenImage) {
            showRemoveFile = true;
        }

        return (
            <View style={styles.container}>
                <Text>
                    {field['#title']}
                </Text>
                <View style={{
                    flexDirection:'row'
                }}>
                </View>
                {this.state.chosenImage === null && this.state.takenImage === null && (<Button title={chosenDocumentText} onPress={()=> this._launchDocumentAsync()}/>)}
                {this.state.chosenDocument && (<Text
                    style={{
                        height:200,
                        width:200
                    }}>
                    {this.state.chosenDocument.name}
                    </Text>)}

                {this.state.chosenDocument === null && this.state.takenImage === null && (<Button title={chosenImageText} onPress={()=>this._launchCameraRollAsync()}/>)}
                {this.state.chosenImage && (<Image
                    source={{uri:this.state.chosenImage.uri}}
                    style={{
                        height:200,
                        width:200
                    }}/>)}
                {this.state.chosenImage === null && this.state.chosenDocument === null && (<Button title={takenImageText} onPress={()=> this._launchCameraAsync()}/>)}
                {this.state.takenImage && (<Image
                    source={{uri:this.state.takenImage.uri}}
                    style={{
                        height:200,
                        width:200
                    }}/>)}
                {showRemoveFile && (
                    <Button color="red" title={removeFileText} onPress={()=> this.removeFile()}/>)}
            </View>

        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Constants.statusBarHeight,
        backgroundColor: '#ecf0f1',
    },
    paragraph: {
        margin: 24,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#34495e',
    },
});