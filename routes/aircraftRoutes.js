const express = require("express");
const router = express.Router();

const Aircraft = require("../models/Aircraft");

/*
GET all aircraft
URL: /api/aircraft
*/
router.get("/", async (req, res) => {
  try {

    const aircraft = await Aircraft.find();

    res.json(aircraft);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching aircraft"
    });

  }
});


/*
GET aircraft by ID
URL: /api/aircraft/:id
*/
router.get("/:id", async (req, res) => {
  try {

    const aircraft = await Aircraft.findById(req.params.id);

    if (!aircraft) {
      return res.status(404).json({
        message: "Aircraft not found"
      });
    }

    res.json(aircraft);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Error fetching aircraft"
    });

  }
});

module.exports = router;