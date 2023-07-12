import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a product name"],
            trim: true,
            maxlength: [120, "Product name should not be more than 120 chars"]
        }
    },
    {
        timestamps: true
    }
)