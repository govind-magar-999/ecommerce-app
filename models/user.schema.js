import mongoose from "mongoose";
import AuthRoles from '../utils/authRoles';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/index"

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


userSchema.pre("save", async function(next){
    if(!this.modified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods = {
    //compare password
    comparePassword: async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password)
    },

    //generate jwt token
    getJwtToken: function() {
        return jwt.sign(
            {
                _id: this._id,
                role: this.role
            },
            config.JWT_SECRET,
            {
                expiresIn: config.JWT_EXPIRY
            }
        );
    },

    generateForgotPasswordToken: function() {
        const forgotToken = crypto.randomBytes(20).toString('hex');

        //step-1 save to DB
        this.forgotPasswordToken = crypto
        .createHash("sha256")
        .update(forgotToken)
        .digest("hex")

        this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000

        //step 2 - return values to user

        return forgotToken
    }
}


export default mongoose.model("User", userSchema)