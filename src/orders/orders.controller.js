const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

/* CRUDL ==> */
function create(req, res, _next) {
  const { deliverTo, mobileNumber, status, dishes } = req.body.data
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes
  }
  orders.push(newOrder)
  res.status(201).json({ data: newOrder })
}

function read(_req, res, _next) {
  res.json({ data: res.locals.order })
}

function update(req, res, _next) {
  const oldOrderData = res.locals.order;
  const newOrderData = req.body.data
  res.status(200).json( {data: {...oldOrderData, ...newOrderData} });
}

function list(_req, res, _next) {
  res.json({ data: orders })
}

function destroy(req, res, _next) {
   const { orderId } = req.params;
  const index = orders.findIndex(order => order.id === Number(orderId));
  const deletedOrders = orders.splice(index, 1);
  res.sendStatus(204);
}
/* <== CRUDL */

// MIDDLEWARE
function orderIdExists(req, res, next) {
  const { orderId } = req.params;
  const order = orders.find(order => order.id === orderId);
  if(order) {
    res.locals.order = order;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`
  })
}

// compares the id passed in the request body with the route/param id
function orderIdsMatch(req, _res, next) {
  const bodyId = req.body.data.id
  const paramId = req.params.orderId

  // No id in request body
  if(bodyId === null || !bodyId || bodyId === "") {
    req.body.data.id = paramId;
    return next();
  }

  // Request body id and route/param id do not match
  if(bodyId != paramId) return next({
    status: 400,
    message: `Order id does not match route id. Order: ${bodyId}, Route: ${paramId}.`
  })
  return next();
}

function orderIsPending(_req, res, next) {
  const { status } = res.locals.order;
  if(status !== 'pending') return next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`
  })
  next()
}

// checks if body contains the property.  Does NOT validate the property
function bodyDataHas(propertyName) {
  return function (req, _res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) return next();
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

/* VALIDATION MIDDLEWARE ==> */
function textPropertyIsValid(propertyName) {
  return function (req, _res, next) {
    if (req.body.data[propertyName] !== "") return next();
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function dishesPropertyIsValid(req, _res, next) {
  const { dishes } = req.body.data;
  if(!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: `Order must include at least one dish`
    })
  }
  next();
}

function quantityPropertyIsValid(req, _res, next) {
  const { dishes } = req.body.data;
  for(let i in dishes) {
    const quantity = dishes[i].quantity;
    if(!quantity || quantity === null || !Number.isInteger(quantity) || quantity < 1) return next({
      status: 400,
      message: `Dish ${i} must have a quantity that is an integer greater than 0`
    })
  }
  next();
}

function statusPropertyIsValid(req, _res, next) {
  const { status } = req.body.data;
  if(!status || status === null || (status !== "pending" && status !== "delivered")) return next({
    status: 400,
    message: `status`
  })
  next();
}
/* <== VALIDATION MIDDLEWARE */

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    textPropertyIsValid("deliverTo"),
    textPropertyIsValid("mobileNumber"),
    dishesPropertyIsValid,
    quantityPropertyIsValid,
    create
  ],
  list,
  read: [orderIdExists, read],
  update: [
    orderIdExists,
    orderIdsMatch,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    textPropertyIsValid("deliverTo"),
    textPropertyIsValid("mobileNumber"),
    dishesPropertyIsValid,
    quantityPropertyIsValid,
    statusPropertyIsValid,
    update
  ],
  delete: [orderIdExists, orderIsPending, destroy]
}