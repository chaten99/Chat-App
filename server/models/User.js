import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      minlength: 6,
    },

    auth0Id: {
      type: String,
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpires: Date,
  },
  { timestamps: true },
);

const User = model("User", userSchema);

export default User;
