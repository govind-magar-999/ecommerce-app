import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a category name"],
            trim: true,
            maxlength: [120, "Collection name should not be more than 120 chars"]
        },
        price: {
            type: Number,
            required: [true, "Please provide a product price"],
            maxlength: [5, "Product price should not be more than 5 digits"]
        },
        description: {
            type: String,
        },
        photos: [
            {
                secure_url: {
                    type: String,
                    required: true
                }
            }
        ],
        stock: {
            type: Number,
            default: 0
        },
        sold: {
            type: Number,
            default: 0
        },
        collectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Collection"
        }
    },
    {
       timestamps: true
    }
);

export default mongoose.model("Collection", collectionSchema)