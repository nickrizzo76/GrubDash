const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

/* CRU(D)L ==> */
function create(req, res, _next) {
  const { name, description, price, image_url } = req.body.data;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url
  }
  dishes.push(newDish);
  res.status(201).json({data: newDish}); 
}

function read(_req, res, _next) {
  res.json({ data: res.locals.dish })
}

function update(req, res, next) {
  const oldDishData = res.locals.dish;
  const newDishData = req.body.data
  res.status(200).json( { data: {...oldDishData, ...newDishData} } );
}

function list(_req, res, _next) {
  res.json({ data: dishes });
}
/* <== CRU(D)L */


// MIDDLEWARE
function dishIdExists(req, res, next) {
  const { dishId } = req.params;
  const dish = dishes.find(dish => dish.id === dishId);
  if(dish) {
    res.locals.dish = dish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`
  })
}

// compares the id passed in the request body with the route/param id
function dishIdsMatch(req, _res, next) {
  const bodyId = req.body.data.id
  const paramId = req.params.dishId

   // No id in request body => assign param id to body id
  if(bodyId === null || !bodyId || bodyId === "") {
    req.body.data.id = paramId;
    return next();
  }

  // Request body id and route/param id do not match
  if(bodyId != paramId) return next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${bodyId}, Route: ${paramId}`
  })
  return next();
}

// checks if body contains the property.  Does NOT validate the property
function bodyDataHas(propertyName) {
  return function (req, _res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) return next();
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

/* VALIDATION MIDDLEWARE ==> */
function textPropertyIsValid(propertyName) {
  return function (req, _res, next) {
    if (req.body.data[propertyName] !== "") return next();
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

function pricePropertyIsValid(req, _res, next) {
    const { price } = req.body.data;
    if(typeof price !== "number") return next({
      status: 400,
      message: `price`
    })
  
    if (price > 0) {
      return next();
    }
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
 };
/* <== VALIDATION MIDDLEWARE */

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    textPropertyIsValid("name"),
    textPropertyIsValid("description"),
    textPropertyIsValid("image_url"),
    pricePropertyIsValid,
    create,
  ],
  read: [dishIdExists, read],
  list,
  update: [
    dishIdExists, 
    dishIdsMatch,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    textPropertyIsValid("name"),
    textPropertyIsValid("description"),
    textPropertyIsValid("image_url"),
    pricePropertyIsValid,
    update
  ],
};
