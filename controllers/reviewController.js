const Review = require("../models/Review");
const Product = require("../models/Product");
const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const checkPermissions = require("../utils/checkPermissions");

const createReview = async (req, res) => {
  const { product: productId } = req.body;

  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new CustomError.NotFoundError(`No product with the id ${productId}`);
  }

  const submittedBefore = await Review.findOne({
    product: productId,
    user: req.user.userId,
  });
  if (submittedBefore) {
    throw new CustomError.BadRequestError(
      "Already submitted a review for this product."
    );
  }

  req.body.user = req.user.userId;

  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};

const getAllReviews = async (req, res) => {
  const review = await Review.find({})
    .populate({
      path: "product",
      select: "name company price",
    })
    .populate({ path: "user", select: "name" });

  res.status(StatusCodes.OK).json({ review, count: review.length });
};

const getSingleReview = async (req, res) => {
  const reviewId = req.params.id;

  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.NotFoundError(`No review with the id ${reviewId}`);
  }

  res.status(StatusCodes.OK).json({ review });
};

const updateReview = async (req, res) => {
  const {
    params: { id: reviewId },
    body: { title, comment, rating },
  } = req;

  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.NotFoundError(`No review with id ${reviewId}`);
  }

  checkPermissions(req.user, review.user);

  review.title = title;
  review.rating = rating;
  review.comment = comment;

  review.save();

  res.status(StatusCodes.OK).json({ review });
};

const deleteReview = async (req, res) => {
  const reviewId = req.params.id;

  const review = await Review.findOne({ _id: reviewId });
  if (!review) {
    throw new CustomError.NotFoundError(`No review with the id ${reviewId}`);
  }
  checkPermissions(req.user, review.user);
  await review.remove();

  res.status(StatusCodes.OK).json({ msg: "Success! review removed" });
};

const getSingleProductReviews = async (req, res) => {
  const { id: productId } = req.params;

  const review = await Review.findOne({ product: productId });
  if (!review) {
    throw new CustomError.NotFoundError("No review for this product");
  }
  res.status(StatusCodes.OK).json({ review, count: review.length });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
};
