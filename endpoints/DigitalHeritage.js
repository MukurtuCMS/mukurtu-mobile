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
      "Media Assets": {
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
      }
    }
  }
}];