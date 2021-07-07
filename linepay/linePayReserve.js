"use strict";

const uuid = require("uuid/v4");
const firebase = require("firebase");
require("firebase/firestore");

const database = firebase.firestore();

/**
「./linePay.js」のファイルは下記から持ってきました。
https://github.com/nkjm/line-pay/blob/v3/module/line-pay.js
*/
const line_pay = require("./linePay.js");

const pay = new line_pay({
  channelId: process.env.LINEPAY_CHANNEL_ID || "test",
  channelSecret: process.env.LINEPAY_CHANNEL_SECRET || "test",
  isSandbox: true,
});
const nameLimit = 90;

module.exports = async (req, res) => {
  const queryString = req.query["liff.state"];
  const params = new URLSearchParams(queryString);
  const userId = params.get("userid");

  const cartData = await database.collection("takeout_order").doc(userId).get();

  var planName = [];
  var planImageUrl = [];
  var planPrice = "";
  if (cartData.exists) {
    const plan = cartData.data();
    planName = plan.planName;
    planImageUrl = plan.planImageUrl;
    planPrice = plan.planPrice;
  }
  console.log((displayCount(planName).slice(0, nameLimit - 3) + "...").length);

  // Generate order information
  const options = {
    amount: planPrice.substring(1),
    currency: "JPY",
    orderId: uuid(),
    packages: [
      {
        id: uuid(),
        amount: planPrice.substring(1),
        name:
          displayCount(planName).length <= nameLimit
            ? displayCount(planName)
            : displayCount(planName).slice(0, nameLimit - 3) + "...",
        products: [
          {
            id: uuid(),
            name: displayCount(planName),
            imageUrl: process.env.BASE_URL + planImageUrl[0],
            quantity: 1,
            price: planPrice.substring(1),
          },
        ],
      },
    ],
    redirectUrls: {
      confirmUrl: process.env.BASE_URL + "/linepay/confirm",
      confirmUrlType: "SERVER",
    },
  };

  pay
    .reserve(options)
    .then(async (response) => {
      let reservation = options;
      reservation.transactionId = response.info.transactionId;
      reservation.userid = userId;

      console.log(`Reservation was made. Detail is following.`);
      console.log(reservation);

      // Save order information
      const plan = cartData.data();
      const planData = {
        transactionId: reservation.transactionId,
        timestamp: new Date(),
        userId: reservation.userid,
        planId: plan.planId,
        planName: plan.planName,
        planImageUrl: plan.planImageUrl,
        planPrice: plan.planPrice,
        options: reservation,
      };

      // Saves the entity
      await database.collection("takeout_order").doc(userId).set(planData);

      res.redirect(response.info.paymentUrl.web);
    })
    .catch(function (e) {
      throw e;
    });
};

const displayCount = (arr) => {
  var count = {};
  for (var i = 0; i < arr.length; i++) {
    var elm = arr[i];
    count[elm] = (count[elm] || 0) + 1;
  }
  return Object.keys(count)
    .map((key) => `${key} × ${count[key]}`)
    .join("\n");
};
