const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const CustomError = require("../errors");
const { attachCookiesToResponse, tokenUser } = require("../utils");

const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailAlreadyExist = await User.findOne({ email });
  if (emailAlreadyExist) {
    throw new CustomError.BadRequestError("Email already in use");
  }

  // first registerd user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const user = await User.create({ name, email, password, role });

  attachCookiesToResponse(res, tokenUser({ user }));
  res.status(StatusCodes.CREATED).json({ user: tokenUser({ user }) });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid credencials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid credencials");
  }

  attachCookiesToResponse(res, tokenUser({ user }));

  res.status(StatusCodes.CREATED).json({ user: tokenUser({ user }) });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    hpptOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({ msg: "User logged out" });
};

module.exports = { register, login, logout };
