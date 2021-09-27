const functions = require("firebase-functions");

exports.paypay_webhook = functions.https.onRequest(
  async (request, response) => {
    const event = request.body;
    // イベントのタイプに応じて処理を行う
    switch (event.state) {
      case "COMPLETED": {
        // 決済成功時
        // const merchantPaymentId = event.merchant_order_id;

        // const cartData = await database
        //   .collection("takeout_order")
        //   .where("merchantPaymentId", "==", merchantPaymentId)
        //   .get();

        // var payload = "";
        // cartData.docs.map((elem) => {
        //   const plan = elem.data();
        //   payload = plan.options;
        // });

        // // delete
        // const clearPlanData = {
        //   merchantPaymentId: "",
        //   planId: [],
        //   planName: [],
        //   planImageUrl: [],
        //   planPrice: "",
        //   options: null,
        //   timestamp: new Date(),
        //   userId: payload.userid,
        // };
        // // Saves the entity
        // await database
        //   .collection("takeout_order")
        //   .doc(payload.userid)
        //   .set(clearPlanData);

        // const user = await database
        //   .collection("user")
        //   .where("userId", "==", payload.userid)
        //   .get();

        // var tel = "";
        // var reservationTime = "";
        // var name = "";
        // user.docs.map((elem) => {
        //   const userData = elem.data();
        //   tel = userData.tel;
        //   name = userData.name;
        //   reservationTime = userData.reservationTime;
        // });

        // const now = new Date(new Date().getTime() + 3600000 * 9);
        // const key =
        //   now.getFullYear() +
        //   "-" +
        //   ("0" + (parseInt(now.getMonth(), 10) + 1)).slice(-2);
        // await database
        //   .collection("transaction")
        //   .doc("monthly")
        //   .collection(key)
        //   .doc(payload.merchantPaymentId)
        //   .set({
        //     userId: payload.userid,
        //     createdAt:
        //       ("0" + (parseInt(now.getMonth(), 10) + 1)).slice(-2) +
        //       "/" +
        //       now.getDate() +
        //       " " +
        //       ("0" + parseInt(now.getHours(), 10)).slice(-2) +
        //       ":" +
        //       ("0" + parseInt(now.getMinutes(), 10)).slice(-2),
        //     timestamp: new Date(),
        //     userName: name,
        //     userTel: tel,
        //     reservationTime: reservationTime,
        //     planName: payload.name,
        //     planPrice: payload.amount,
        //     finished: false,
        //     service: "paypay",
        //   });

        // // 予約数,売り上げを更新する
        // const [year, month, day] = reservationTime.split(" ")[0].split("-");
        // const bookingData = await database
        //   .collection("booking")
        //   .doc(year + "-" + month)
        //   .get();
        // if (bookingData.exists) {
        //   const arr = bookingData.data().current;
        //   arr[parseInt(day, 10) - 1]++;
        //   const arr2 = bookingData.data().max;
        //   const [hour, _] = reservationTime.split(" ")[1].split(":");
        //   arr2[parseInt(day, 10) - 1][hour + "時台"][1]--;
        //   const arr3 = bookingData.data().sales;
        //   arr3[parseInt(day, 10) - 1] += parseInt(payload.amount, 10);
        //   database
        //     .collection("booking")
        //     .doc(year + "-" + month)
        //     .update({
        //       current: arr,
        //       max: arr2,
        //       sales: arr3,
        //     });
        // }
        response.json({ received: true }); // ステータス200でレスポンスを返却
        break;
      }
      default: {
        return response.status(400).end(); // ステータス400でレスポンスを返却
      }
    }
  }
);
