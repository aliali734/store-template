const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },

        name: {
          type: String,
          required: true,
          trim: true
        },

        quantity: {
          type: Number,
          required: true,
          min: 1
        },

        price: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],

    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet", "bnpl"],
      required: true,
      default: "cash"
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },

    paymentProvider: {
      type: String,
      enum: ["cod", "stripe", "moyasar", "paytabs", "tabby", "tamara", ""],
      default: "cod"
    },

    paymentReference: {
      type: String,
      default: "",
      trim: true
    },

    isPaid: {
      type: Boolean,
      default: false
    },

    paidAt: {
      type: Date
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Order || mongoose.model("Order", orderSchema);