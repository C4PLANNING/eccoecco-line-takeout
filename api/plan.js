"use strict";

const jsonData = require("../data.json");

module.exports = (req, res) => {
  let planId = req.query.id;
  let plan = jsonData.menu.filter((p) => p.id == planId)[0];
  res.json({ plan });
};
