// import ImageFactory from 'react-native-image-picker-form';
// import FilesNotSanitized from 'tcomb-form-native-builder-components/lib/factories/files';
import DocumentPickerFactory from '../components/File.js';

export default DigitalHeritage = [{
  "type": "tab",
  "label": "Mukurtu Essentials",
  "form": {
    "type": "object",
    "properties": {
      "Title": {
        "type": "string"
      },
      "Summary": {
        "type": "string"
      },
/*      "Media Assets": {
        "type": "string"
      },*/
      "File": {
        "type": "string"
      },
      "Communities and Protocols": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "Community": {
              "type": "string",
              "enum": ["Test Community 1", "Test Community 2"]
            },
            "Protocol": {
              "type": "string",
              "enum": ["Test Protocol 1", "Test Protocol 2"]
            }
          },
          "required": ["name", "surname"]
        },
      },
      "General": {
        "type": "boolean"
      }
    },
    "required": ["title", "surname"]
  },
  "options": {
    fields: {
      "General": {
        label: "Categories"
      },
      "File": {
        factory: DocumentPickerFactory
      }
/*      "File": {
        factory: FilesNotSanitized
      }*/
    }
  }
}];
