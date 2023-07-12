import User from '../models/user.schema.js'
import asyncHandler from '../services/asyncHandler.js'
import CustomError from '../utils/customError.js'
import mailHelper from '../utils/mailHelper.js'
import crypto from 'crypto'

export const cookieOptions = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    httpOnly: true
}

/*
Sign up
route http://localhost:4000/api/auth/signup
description USer Controller for creating new user
parameters name, email, password
returns user object
*/ 

export const signUp = asyncHandler(async (req, res) => {
    const {name, email, password} = req.body

    if(!name || !email || !password) {
        throw new CustomError('Please fill all fields', 400)
    }

    //If user already exists
    const existingUser = await User.findOne({email})

    if(existingUser) {
        throw new CustomError('User already exists', 400)
    }

    const user = await User.create({
        name, email, password
    })

    const token = user.getJwtToken()
    console.log(user);
    user.password = undefined

    res.cookie("token", token, cookieOptions)

    res.status(200).json({
        success: true, 
        token,
        user
    })
})


/*
Log in
route http://localhost:4000/api/auth/login
description: User Controller for logging in
parameters email, password
returns user object
*/ 

export const login = asyncHandler(async (req, res) => {
    const {name, email, password} = req.body

    if (!email || !password) {
        throw new CustomError('Please fill both fields', 400)
    }

    const user = await User.findOne({email}).select("+password")

    if(!user){
        throw new CustomError('Invalid credentials', 400)
    }

   const isPasswordMatched = await user.comparePassword(password)

   if(isPasswordMatched) {
        const token = user.getJwtToken()
        user.password = undefined
        res.cookie("token", token, cookieOptions)
        return res.status(200).json({
            success: true, 
            token,
            user 
        })
   }

   throw new CustomError('Invalid credentials - pass', 400)
})

/*
Log out
route http://localhost:4000/api/auth/logout
description: User logout by clearing user cookies
returns success message
*/

export const logout = asyncHandler(async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: "Logged out" 
    })
})

/*
Forgot password
route http://localhost:4000/api/auth/password/forgot
description: User forgot password page to reset his password
returns success message - Email
*/

export const forgotPassword = asyncHandler(async (req, res) => {
   const {email} = req.body
   const user = await User.findOne({email})

   if(!user) {
    throw new CustomError('User not found', 404)
   }
   const resetToken = user.generateForgotPasswordToken()

   await user.save({validateBeforeSave: false})

   const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/password/reset/${resetToken}`

   const text = `Your password reset link is \n \n ${resetUrl} \n\n`
   try {
    await mailHelper({
        email: user.email,
        subject: "Password reset email for website",
        text: text,
    })
    res.status(200).json({
        success: true,
        message: `Email sent to ${user.email}`
    })
   } catch (error) {
    //roll back - clear fields and save
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined

    await user.save({validateBeforeSave: false})

     throw new CustomError(error.message||`Email sent failure`, 500)
   }
})


/*
RESET password
route http://localhost:4000/api/auth/password/reset/:resetpasswordtoken
description: User wants to reset password based on url token
params token from url, password and confirmpass
returns success message - Email
*/

export const resetpassword = asyncHandler(async (req, res) => {
    const {token: resetToken} = req.params
    const {password, confirmPassword} = req.body
    
    const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

    const user = User.findOne({
        forgotPasswordToken: resetPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    });

    if(!user) {
        throw new CustomError('password token is invalid or expired', 400)
    }

    if(password !== confirmPassword) {
        throw new CustomError('password and confirm password dont match', 400)
    }

    user.password = password
    user.forgotPassword = undefined
    user.forgotPasswordExpiry = undefined

    await user.save()

    //create token and send as a response

    const token = user.getJwtToken()
    user.password = undefined

    //helper method for cookie
    res.cookie("token", token, cookieOptions)
    res.status(200).json({
        success: true,
        user
    })
})


/*
Get user profile
Request type: GET
route: http://localhost:4000/api/auth/profile
description: Check for token and populate user
parameters: 
returns user object
*/ 

export const getProfile = asyncHandler(async (req, res) => {
    const {user} = req
    if(!user) {
        throw new CustomError('User not found', 404)
    }
    res.status(200).json({
        success: true,
        user
    })
})

// TODO: Change a password