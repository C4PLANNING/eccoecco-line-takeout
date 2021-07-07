"use strict";

/**
「./linePay.js」のファイルは下記から持ってきました。
https://github.com/nkjm/line-pay/blob/v3/module/line-pay.js
*/

const firebase = require("firebase");
require("firebase/firestore");

const database = firebase.firestore();

const line_pay = require("./linePay.js");
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "test",
  channelSecret: process.env.CHANNEL_SECRET || "test",
};

const pay = new line_pay({
  channelId: process.env.LINEPAY_CHANNEL_ID || "test",
  channelSecret: process.env.LINEPAY_CHANNEL_SECRET || "test",
  isSandbox: true,
});

const client = new line.Client(config);

module.exports = async (req, res) => {
  if (!req.query.transactionId) {
    throw new Error("Transaction Id not found.");
  }

  // get Datasore data
  const cartData = await database
    .collection("takeout_order")
    .where("transactionId", "==", req.query.transactionId)
    .get();

  var reservation = "";
  cartData.docs.map((elem) => {
    const plan = elem.data();
    reservation = plan.options;
  });

  // Retrieve the reservation from database.
  if (!reservation) {
    throw new Error("Reservation not found.");
  }

  console.log(`Retrieved following reservation.`);
  console.log(reservation);

  let confirmation = {
    transactionId: req.query.transactionId,
    amount: reservation.amount,
    currency: reservation.currency,
  };

  console.log(`Going to confirm payment with following options.`);
  console.log(confirmation);

  pay.confirm(confirmation).then(async (response) => {
    await client.pushMessage(reservation.userid, [
      {
        type: "flex",
        altText: "お支払いを完了しました。",
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "お支払い完了しました。💰",
                size: "md",
                weight: "bold",
              },
              {
                type: "text",
                text: "ありがとうございました。🌟",
                size: "md",
                weight: "bold",
              },
            ],
          },
        },
      },
      {
        type: "sticker",
        packageId: 11537,
        stickerId: 52002734,
      },
      {
        type: "location",
        title: "エッコ・エッコ上野店",
        address: "東京都台東区東上野４丁目１０−８",
        latitude: 35.714256,
        longitude: 139.77992,
      },
      {
        type: "text",
        text: "※入谷店ではお取り扱いしておりません。ご指定時間に上記の上野店までお越しください。\n\nご利用まことにありがとうございました。",
        // type: "text",
        // text: "最後に、プラン申込からお支払いまでのお手続きは分かりやすかったですか？",
        // quickReply: {
        //   items: [
        //     {
        //       type: "action",
        //       action: {
        //         type: "postback",
        //         label: "はい🎵",
        //         data: "action=questionnaire&result=yes",
        //         displayText: "はい🎵",
        //       },
        //     },
        //     {
        //       type: "action",
        //       action: {
        //         type: "postback",
        //         label: "いいえ😞",
        //         data: "action=questionnaire&result=no",
        //         displayText: "いいえ😞",
        //       },
        //     },
        //   ],
        // },
      },
    ]);
  });

  // delete
  const clearPlanData = {
    transactionId: "",
    planId: [],
    planName: [],
    planImageUrl: [],
    planPrice: "",
    options: null,
    timestamp: new Date(),
    userId: reservation.userid,
  };
  // Saves the entity
  await database
    .collection("takeout_order")
    .doc(reservation.userid)
    .set(clearPlanData);
  const profile = await client.getProfile(reservation.userid);

  const user = await database
    .collection("user")
    .where("name", "==", profile.displayName)
    .get();

  var tel = "";
  var reservationTime = "";

  user.docs.map((elem) => {
    const userData = elem.data();
    tel = userData.tel;
    reservationTime = userData.reservationTime;
  });

  await database.collection("transaction").doc(reservation.transactionId).set({
    userId: reservation.userid,
    timestamp: new Date(),
    userName: profile.displayName,
    userTel: tel,
    reservationTime: reservationTime,
    planName: reservation.packages[0].products[0].name,
    planPrice: reservation.packages[0].amount,
  });

  // 予約数を更新する
  const [year, month, day] = reservationTime.split(" ")[0].split("-");
  const bookingData = await database
    .collection("booking")
    .doc(year + "-" + month)
    .get();
  if (bookingData.exists) {
    const arr = bookingData.data().current;
    arr[parseInt(day, 10) - 1]++;
    const arr2 = bookingData.data().max;
    const [hour, _] = reservationTime.split(" ")[1].split(":");
    arr2[parseInt(day, 10) - 1][hour + "時台"][1]--;
    database
      .collection("booking")
      .doc(year + "-" + month)
      .update({
        current: arr,
        max: arr2,
      });
  }
};
