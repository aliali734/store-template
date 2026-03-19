const mongoose = require("mongoose");

const HeaderSchema = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: "",
      trim: true
    },

    menu: [
      {
        title: {
          type: String,
          required: true,
          trim: true
        },
        sections: [
          {
            title: {
              type: String,
              default: "",
              trim: true
            },
            links: [
              {
                label: {
                  type: String,
                  default: "",
                  trim: true
                },
                url: {
                  type: String,
                  default: "#",
                  trim: true
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

module.exports =
  mongoose.models.Header || mongoose.model("Header", HeaderSchema);