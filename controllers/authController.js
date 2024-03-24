const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  return res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res) => {
  try {
    console.log("request body ", req.body);

    const { phone_number, password, passwordConfirm, priority } = req.body;

    if (!phone_number || !password || !passwordConfirm || !priority) {
      return res.status(400).json({
        status: "fail",
        message: "please provide all the required fields",
      });
    }

    const userExist = await User.findOne({ phone_number });

    if (userExist) {
      return res.status(400).json({
        status: "fail",
        message: "user with that phone number already exist",
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "password and passwordConfirm are not same",
      });
    }

    const user = await User.create({ phone_number, password, priority });

    createSendToken(user, 201, res);
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    let { phone_number, password } = req.body;

    if (!phone_number || !password) {
      return res.status(400).json({
        status: "fail",
        message: "please provide all the required fields",
      });
    }

    phone_number = phone_number.toString();
    password = password.toString();

    const user = await User.findOne({ phone_number });

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "incorrect phone number or password",
      });
    }

    createSendToken(user, 200, res);
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
      error: err,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        error: "You are not logged in!! login to perform this action",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res
        .status(401)
        .json({ error: "The user with this token no longer exists" });
    }

    req.user = currentUser;

    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
