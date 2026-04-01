const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: "USD",
      trim: true,
      uppercase: true
    },

    method: {
      type: String,
      enum: ["cash", "card", "wallet", "bnpl"],
      required: true,
      default: "cash"
    },

    provider: {
      type: String,
      enum: ["cod", "stripe", "moyasar", "paytabs", "tabby", "tamara", ""],
      default: "cod"
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true
    },

    reference: {
      type: String,
      default: "",
      trim: true,
      index: true
    },

    providerResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    paidAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);