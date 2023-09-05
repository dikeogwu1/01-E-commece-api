const Product = require("../models/Product");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const path = require("path");

const createProduct = async (req, res) => {
  req.body.user = req.user.userId;
  const product = await Product.create(req.body);
  res.status(StatusCodes.CREATED).json({ product });
};

const getAllProduct = async (req, res) => {
  const product = await Product.find({});

  res.status(StatusCodes.OK).json({ product, count: product.length });
};

const getSingleProduct = async (req, res) => {
  const { id: productId } = req.params;

  if (!productId) {
    throw new CustomError.NotFoundError(
      `No product with the id of ${productId}`
    );
  }

  const product = await Product.findOne({ _id: productId }).populate("reviews");
  res.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ product });
};

const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;

  if (!productId) {
    throw new CustomError.NotFoundError(
      `No product with the id of ${productId}`
    );
  }

  const product = await Product.findOne({ _id: productId });
  await product.remove();

  res.status(StatusCodes.OK).json({ msg: "Success! product deleted" });
};

const uploadProductImage = async (req, res) => {
  const productImage = req.files;

  if (!productImage) {
    throw new CustomError.BadRequestError("No image uploaded.");
  }

  const image = productImage.image;

  if (!image.mimetype.startsWith("image")) {
    throw new CustomError.BadRequestError("Please upload an image.");
  }

  const maxSize = 1000 * 1000;

  if (image.size > maxSize) {
    throw new CustomError.BadRequestError(
      "Please upload an image less than 1MB"
    );
  }

  const imagePath = path.join(
    __dirname,
    "../public/uploads/" + `${image.name}`
  );
  image.mv(imagePath);

  res.status(StatusCodes.OK).json({ image: `/uploads/${image.name}` });
};

module.exports = {
  createProduct,
  getAllProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};
