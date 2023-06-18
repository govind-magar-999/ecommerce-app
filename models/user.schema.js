import mongoose from "mongoose";
import AuthRoles from '../utils/authRoles';
const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            maxLength: [50, "Max character length allowed for name is 50"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minLength: [8, "Min character length required for password is 8"],
            select: false
        },

        role: {
            type: String,
            enum: Object.values(AuthRoles),
            default: AuthRoles.USER
        },

        forgotPasswordToken: String,
        forgotPasswordExpiry: Date,
    },

    {
        timestamps: true
    }
);

export default mongoose.model("User", userSchema)