const mongoose = require("mongoose");

const HeaderSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: ""
    },

    menu: [
      {
        title: {
          type: String,
          required: true
        },
        sections: [
          {
            title: {
              type: String,
              default: ""
            },
            links: [
              {
                label: {
                  type: String,
                  default: ""
                },
                url: {
                  type: String,
                  default: "#"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.models.Header || mongoose.model("Header", HeaderSchema);