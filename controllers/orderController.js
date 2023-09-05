const Product = require("../models/Product");
const Order = require("../models/Order");

const CustomError = require("../errors");
const { StatusCodes } = require("http-status-codes");
const checkPermissions = require("../utils/checkPermissions");

const fakeStripeApi = async ({ amount, currency }) => {
  const client_secret = "someRandomValue";
  return { client_secret, amount };
};

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;

  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError("No cart items provided.");
  }
  if (!tax || !shippingFee) {
    throw new CustomError.BadRequestError(
      "Please provide tax and shipping fee."
    );
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new CustomError.NotFoundError(`No item with id : ${item.product}`);
    }
    const { name, price, image, _id } = dbProduct;
    const singleOrderItems = {
      amount: item.amount,
      name,
      price,
      image,
      product: _id,
    };
    // add item to order
    orderItems = [...orderItems, singleOrderItems];
    // calculate subtotal
    subtotal += item.amount * price;
  }
  // calculate total
  const total = tax + shippingFee + subtotal;
  // get client secret
  const paymentIntent = await fakeStripeApi({
    amount: total,
    currency: "usd",
  });

  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.client_secret,
    user: req.user.userId,
  });
  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
  const order = await Order.find({});
  res.status(StatusCodes.OK).json({ order, count: order.length });
};
const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;

  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }

  checkPermissions(req.user, order.user);

  res.status(StatusCodes.OK).json({ order });
};

const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const { paymentIntent: paymentIntentId } = req.body;

  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`);
  }

  checkPermissions(req.user, order.user);

  order.paymentIntent = paymentIntentId;
  order.status = "paid";
  await order.save();

  res.status(StatusCodes.OK).json({ order });
};
// const deleteOrder = async (req,res)=>{
//  res.send('delete order')
// }
const getCurrentUserOrders = async (req, res) => {
  const order = await Order.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ order, count: order.length });
};

module.exports = {
  createOrder,
  getAllOrders,
  getSingleOrder,
  updateOrder,
  getCurrentUserOrders,
};
