const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const cloudinary = require("cloudinary").v2;

const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  //   VALIDATE INPUTS

  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill all required fields");
  }

  //   GET AND VALIDATE USER
  const userId = req.user._id;
  if (!userId) {
    res.status(400);
    throw new Error("User not found");
  }

  //   HANDLE FILE UPLOAD
  let fileData = {};

  if (req.file) {
    //   Upload to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "PInvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new error("Image coukd not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    };
  }

  //   CREATE PRODUCT
  const product = await Product.create({
    user: userId,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  if (!product) {
    res.status(400);
    throw new Error("Product creation failed!!");
  }

  res.status(200).json(product);
});

/*


*/
// GET ALL PRODUCTS
const getAllProducts = asyncHandler(async (req, res) => {
  // GET USER
  const user = req.user;

  // VALIDATE USER
  if (!user) {
    res.status(400);
    throw new Error("User not found");
  }

  // GET PRODUCTS ASSOCIATED WITH THE USER
  const products = await Product.find({ user: user._id });
  if (!products) {
    res.status(400);
    throw new Error("Products not found");
  }
  res.status(200).json(products);
});

/*


*/
// GET A SINGLE PRODUCT
const getProduct = asyncHandler(async (req, res) => {
  // GET USER
  const user = req.user;
  const { productId } = req.params;

  // VALIDATE USER
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // GET PRODUCTS ASSOCIATED WITH THE USER
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // CHECK IF USER IS AUTHORIZED

  if (product.user.toString() !== user.id) {
    res.status(400);
    throw new Error("User not found");
  }

  res.status(200).json(product);
});

/*


*/
// DELETE PRODUCT
const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = req.user;

  // GET PRODUCT
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // CHECK IF USER IS AUTHORIZED
  if (product.user.toString() !== user.id) {
    res.status(400);
    throw new Error("User not found");
  }

  // DELETE PRODUCT
  await product.remove({ id: productId });

  res.status(200).json("Product deleted successfully");
});

/*


*/
// UPDATE PRODUCT
const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = req.user;

  // GET PRODUCTS ASSOCIATED WITH THE USER
  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.user.toString() !== user.id) {
    res.status(400);
    throw new Error("User not found");
  }

  //   //   HANDLE FILE UPLOAD
  let fileData = {};

  if (req.file) {
    //   Upload to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "PInvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new error("Image coukd not be uploaded");
    }
    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    };
  }

  //   //   CREATE PRODUCT
  //   const productt = await Product.create({
  //     user: userId,
  //     name,
  //     sku,
  //     category,
  //     quantity,
  //     price,
  //     description,
  //     image: fileData,
  //   });

  //   if (!product) {
  //     res.status(400);
  //     throw new Error("Product creation failed!!");
  //   }

  //   res.status(200).json(product);

  const { name, sku, category, quantity, price, description, image } = product;

  product.name = req.body.name || name;
  product.category = req.body.category || category;
  product.quantity = req.body.quantity || quantity;
  product.price = req.body.price || price;
  product.description = req.body.description || description;
  product.image = image;

  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: productId },
    {
      name: req.body.name || name,

      category: req.body.category || category,
      quantity: req.body.quantity || quantity,
      price: req.body.price || price,
      description: req.body.description || description,
      image: Object.keys(fileData).lenght === 0 ? image : fileData,
    },
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    res.status(401);
    throw new Error("Error updating user password");
  }
  res.status(201).json(updatedProduct);
});

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
