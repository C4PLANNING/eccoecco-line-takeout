"use strict";

const line = require("@line/bot-sdk");

const firebase = require("firebase");
require("firebase/firestore");

const menuData = require("./menuData");
const database = firebase.firestore();

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "test",
  channelSecret: process.env.CHANNEL_SECRET || "test",
};

const base_url = process.env.BASE_URL;
const client = new line.Client(config);
var index = 1;

module.exports = async (req, res) => {
  Promise.all(req.body.events.map(await handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(200).end();
    });
};

// event handler
async function handleEvent(event, session) {
  let echo = [];
  const jsonData = await menuData.createData();
  const cartData = await database
    .collection("takeout_order")
    .doc(event.source.userId)
    .get();

  if (event.type === "message") {
    if (event.message.text.substring(0, 5) === "お申し込み") {
      const userdata = await database
        .collection("user")
        .doc(event.source.userId)
        .get();
      if (userdata.exists) {
        const [year, month, date] = userdata.data().reservationDate.split("-");
        const bookingData = await database
          .collection("booking")
          .doc(year + "-" + month)
          .get();
        if (bookingData.exists) {
          const _data = bookingData.data();
          const day = parseInt(date, 10);
          const currentData = _data.max[day - 1];
          const timezoneBooking = Object.values(currentData).map(
            (item) => item[1]
          );
          const today = new Date(new Date().getTime() + 3600000 * 9);

          let arr = [];
          if (day === today.getDate()) {
            // 30分後に受付開始
            const open = today.setMinutes(
              Math.round(today.getMinutes() / 15) * 15 + 30
            );
            const h = ("00" + new Date(open).getHours()).slice(-2);
            const M = ("00" + new Date(open).getMinutes()).slice(-2);
            // 11:30-14:15
            [...Array(12)].map((_, i) => {
              const date = new Date();
              date.setHours(11);
              date.setMinutes(30);
              const _date = new Date(date).setMinutes(
                new Date(date).getMinutes() + i * 15
              );
              const hh = ("00" + new Date(_date).getHours()).slice(-2);
              const MM = ("00" + new Date(_date).getMinutes()).slice(-2);
              if (
                h + ":" + M <= hh + ":" + MM &&
                currentData[hh + "時台"][1] > 0
              ) {
                arr.push(hh + ":" + MM);
              }
            });
            arr.push("dummy");
            // 17:30-21:30
            [...Array(17)].map((_, i) => {
              const date = new Date();
              date.setHours(17);
              date.setMinutes(30);
              const _date = new Date(date).setMinutes(
                new Date(date).getMinutes() + i * 15
              );
              const hh = ("00" + new Date(_date).getHours()).slice(-2);
              const MM = ("00" + new Date(_date).getMinutes()).slice(-2);
              if (
                h + ":" + M <= hh + ":" + MM &&
                currentData[hh + "時台"][1] > 0
              ) {
                arr.push(hh + ":" + MM);
              }
            });
          } else {
            // 11:30-14:15
            [...Array(12)].map((_, i) => {
              const date = new Date();
              date.setHours(11);
              date.setMinutes(30);
              const _date = new Date(date).setMinutes(
                new Date(date).getMinutes() + i * 15
              );
              const hh = ("00" + new Date(_date).getHours()).slice(-2);
              const MM = ("00" + new Date(_date).getMinutes()).slice(-2);
              if (currentData[hh + "時台"][1] > 0) {
                arr.push(hh + ":" + MM);
              }
            });
            arr.push("dummy");
            // 17:30-21:30
            [...Array(17)].map((_, i) => {
              const date = new Date();
              date.setHours(17);
              date.setMinutes(30);
              const _date = new Date(date).setMinutes(
                new Date(date).getMinutes() + i * 15
              );
              const hh = ("00" + new Date(_date).getHours()).slice(-2);
              const MM = ("00" + new Date(_date).getMinutes()).slice(-2);
              if (currentData[hh + "時台"][1] > 0) {
                arr.push(hh + ":" + MM);
              }
            });
          }

          if (arr.length >= 2) {
            const lunch = arr.splice(0, arr.indexOf("dummy"));
            arr.splice(0, 1);

            const buttons = lunch.map((item) => {
              return {
                type: "button",
                style: "primary",
                action: {
                  type: "postback",
                  label: item,
                  data:
                    "action=pay&arrival=" +
                    userdata.data().reservationDate +
                    " " +
                    item,
                  displayText: "来店希望時間: " + item,
                },
              };
            });

            const buttons2 = arr.map((item) => {
              return {
                type: "button",
                style: "primary",
                action: {
                  type: "postback",
                  label: item,
                  data:
                    "action=pay&arrival=" +
                    userdata.data().reservationDate +
                    " " +
                    item,
                  displayText: "来店希望時間: " + item,
                },
              };
            });

            echo = {
              type: "flex",
              altText: "来店希望時間",
              contents: {
                type: "bubble",
                header: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "来店希望時間を選択してください",
                      size: "md",
                      margin: "md",
                      wrap: true,
                    },
                    {
                      type: "separator",
                      margin: "xxl",
                    },
                  ],
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    ...buttons,
                    {
                      type: "separator",
                      margin: "xxl",
                    },
                    ...buttons2,
                  ],
                },
              },
            };
          } else {
            echo = {
              type: "text",
              text:
                "申し訳ありませんが、" +
                userdata.data().reservationDate +
                "は、予約で埋まっているか、休業日です。別の日付を再度選択してください。",
            };
          }
        } else {
          console.log("No such document!");
        }
      } else {
        console.log("No such document!");
      }
    } else if (event.message.text.substring(0, 4) === "メニュー") {
      echo = {
        type: "flex",
        altText: "メニューを送信しました。",
        contents: {
          type: "carousel",
          contents: await getPlanCarousel(jsonData),
        },
      };
    } else if (event.message.text.substring(0, 3) === "カート") {
      var _data = {};
      if (cartData.exists) {
        _data = cartData.data();
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }

      echo = {
        type: "flex",
        altText: "カート内容の確認",
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "エッコ・エッコ上野店",
                weight: "bold",
                color: "#1DB446",
                size: "sm",
              },
              {
                type: "text",
                text: "カート内容の確認",
                weight: "bold",
                size: "xl",
                margin: "md",
              },
              {
                type: "separator",
                margin: "xxl",
              },
              {
                type: "box",
                layout: "vertical",
                margin: "xxl",
                spacing: "sm",
                contents: Object.entries(displayCount(_data))
                  .map(([key, count]) => {
                    const price = jsonData["menu"]
                      .filter((p) => p.name === key)[0]
                      .price.substring(1);
                    return {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: key,
                          size: "sm",
                          color: "#555555",
                          flex: 5,
                          wrap: true,
                        },
                        {
                          type: "text",
                          text: count + "点",
                          size: "sm",
                          color: "#555555",
                          flex: 1,
                        },
                        {
                          type: "button",
                          adjustMode: "shrink-to-fit",
                          margin: "xs",
                          action: {
                            type: "postback",
                            label: "変更",
                            data:
                              "action=orderCheck&orderCount=" +
                              count +
                              "&planId=" +
                              jsonData["menu"].filter((p) => p.name == key)[0]
                                .id,
                            displayText: "オーダー数変更",
                          },
                          flex: 2,
                        },
                        {
                          type: "text",
                          text:
                            (
                              parseInt(price, 10) * parseInt(count, 10)
                            ).toLocaleString() + "円",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                          flex: 2,
                          wrap: true,
                        },
                      ],
                    };
                  })
                  .concat([
                    {
                      type: "separator",
                      margin: "xxl",
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "xxl",
                      contents: [
                        {
                          type: "text",
                          text: "注文数",
                          size: "sm",
                          color: "#555555",
                        },
                        {
                          type: "text",
                          text: _data.planId.length + "点",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "合計",
                          size: "sm",
                          color: "#555555",
                        },
                        {
                          type: "text",
                          text:
                            parseInt(
                              _data.planPrice
                                ? _data.planPrice.substring(1)
                                : "0"
                            ).toLocaleString() + "円",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                  ]),
              },
              {
                type: "separator",
                margin: "xxl",
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: "表示は税込価格",
                    size: "xs",
                    color: "#aaaaaa",
                    flex: 0,
                  },
                ],
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "メニュー再表示",
                  text: "メニュー",
                },
              },
              {
                type: "button",
                style: "primary",
                action: {
                  type: "uri",
                  label: "個人情報入力",
                  uri: "https://liff.line.me/" + process.env.INFO_LIFF_ID,
                },
              },
            ],
          },
        },
      };
    } else {
      echo = { type: "text", text: "申し訳ありませんが、お返事できません。" };
    }
  } else if (event.type === "follow") {
    echo = {
      type: "flex",
      altText: "メニューを送信しました。",
      contents: {
        type: "carousel",
        contents: await getPlanCarousel(jsonData),
      },
    };
  } else if (event.type === "postback") {
    // 埋め込みデータ取得
    const data = new URLSearchParams(event.postback.data);
    const action = data.get("action");
    const result = data.get("result");
    const planid = data.get("planId");
    const initialize = data.get("initialize");
    const orderCount = parseInt(data.get("orderCount"), 10);
    const arrival = data.get("arrival");
    // プランデータ申込（選択1 注文数、選択2 大盛り選択、選択3 半熟たまご）
    if (action === "orderCount") {
      echo = [
        { type: "text", text: "注文数を選択してください" },
        {
          type: "flex",
          altText: "注文数選択画面を送信しました",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "horizontal",
              spacing: "md",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "1",
                    data:
                      "action=selectLarge&initialize=true&orderCount=1&planId=" +
                      planid,
                    displayText: "1つ",
                  },
                },
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "2",
                    data:
                      "action=selectLarge&initialize=true&orderCount=2&planId=" +
                      planid,
                    displayText: "2つ",
                  },
                },
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "3",
                    data:
                      "action=selectLarge&initialize=true&orderCount=3&planId=" +
                      planid,
                    displayText: "3つ",
                  },
                },
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "4",
                    data:
                      "action=selectLarge&initialize=true&orderCount=4&planId=" +
                      planid,
                    displayText: "4つ",
                  },
                },
              ],
            },
          },
        },
      ];
    } else if (action === "selectLarge") {
      var location = "";
      const target = parseInt(planid.split(",").pop(), 10) % 100;
      if (initialize) index = 1;
      if (jsonData["menu"].filter((p) => p.id == target)[0].egg) {
        if (index <= orderCount) {
          location = "selectEgg";
        } else {
          location = "select";
        }

        echo = {
          type: "text",
          text:
            orderCount === 1
              ? "オプション 大盛り選択（＋100円）"
              : `${index}つ目 オプション 大盛り選択（＋100円）`,
          quickReply: {
            items: [
              {
                type: "action",
                action: {
                  type: "postback",
                  label: "大盛り",
                  data: `action=${location}&orderCount=${orderCount}&planId=${
                    index === 1 ? "" : planid + ","
                  }${target + 100}`,
                  displayText: "大盛り",
                },
              },
              {
                type: "action",
                action: {
                  type: "postback",
                  label: "通常",
                  data: `action=${location}&orderCount=${orderCount}&planId=${
                    index === 1 ? planid : planid + "," + target
                  }`,
                  displayText: "通常",
                },
              },
            ],
          },
        };
      } else {
        if (index < orderCount) {
          location = "selectLarge";
        } else {
          location = "select";
        }

        echo = {
          type: "text",
          text:
            orderCount === 1
              ? "オプション 大盛り選択（＋100円）"
              : `${index}つ目 オプション 大盛り選択（＋100円）`,
          quickReply: {
            items: [
              {
                type: "action",
                action: {
                  type: "postback",
                  label: "大盛り",
                  data: `action=${location}&orderCount=${orderCount}&planId=${
                    index === 1 ? "" : planid + ","
                  }${target + 100}`,
                  displayText: "大盛り",
                },
              },
              {
                type: "action",
                action: {
                  type: "postback",
                  label: "通常",
                  data: `action=${location}&orderCount=${orderCount}&planId=${
                    index === 1 ? planid : planid + "," + target
                  }`,
                  displayText: "通常",
                },
              },
            ],
          },
        };
        index += 1;
      }
    } else if (action === "selectEgg") {
      var location = "";
      const target = parseInt(planid.split(",").pop(), 10);
      const prev = planid.slice(0, planid.lastIndexOf(",") + 1);
      if (index < orderCount) {
        location = "selectLarge";
      } else {
        location = "select";
      }

      echo = {
        type: "text",
        text:
          orderCount === 1
            ? "オプション 半熟たまご追加選択（＋80円）"
            : `${index}つ目 オプション 半熟たまご追加選択（＋80円）`,
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "半熟たまご追加",
                data: `action=${location}&orderCount=${orderCount}&planId=${prev}${
                  target + 200
                }`,
                displayText: "半熟たまご追加",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "通常",
                data: `action=${location}&orderCount=${orderCount}&planId=${planid}`,
                displayText: "通常",
              },
            },
          ],
        },
      };
      index += 1;
    } else if (action === "select") {
      index = 1;
      const selData = planid
        .split(",")
        .map(
          (item) =>
            jsonData["menu"].filter((p) => p.id == parseInt(item, 10))[0]
        );
      console.log(selData);

      var plan = {};

      if (cartData.exists) {
        plan = cartData.data();
      }

      const _planId = plan.planId || [];
      const _planName = plan.planName || [];
      const _planImageUrl = plan.planImageUrl || [];
      const _planPrice = plan.planPrice
        ? parseInt(plan.planPrice.substring(1), 10)
        : 0;

      const newPlanData = {
        timestamp: new Date(),
        userId: event.source.userId,
        planId: _planId.concat(planid.split(",")),
        planName: _planName.concat(selData.map((item) => item.name)),
        planImageUrl: _planImageUrl.concat(
          selData.map((item) => item.imageUrl)
        ),
        planPrice:
          "¥" +
          (_planPrice +
            selData
              .map((item) => parseInt(item.price.substring(1), 10))
              .reduce((a, b) => a + b)),
      };

      // Saves the entity
      await database
        .collection("takeout_order")
        .doc(event.source.userId)
        .set(newPlanData);

      echo = {
        type: "flex",
        altText: "カート内容の確認",
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "エッコ・エッコ上野店",
                weight: "bold",
                color: "#1DB446",
                size: "sm",
              },
              {
                type: "text",
                text: "カート内容の確認",
                weight: "bold",
                size: "xl",
                margin: "md",
              },
              {
                type: "separator",
                margin: "xxl",
              },
              {
                type: "box",
                layout: "vertical",
                margin: "xxl",
                spacing: "sm",
                contents: Object.entries(displayCount(newPlanData))
                  .map(([key, count]) => {
                    const price = jsonData["menu"]
                      .filter((p) => p.name === key)[0]
                      .price.substring(1);
                    return {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: key,
                          size: "sm",
                          color: "#555555",
                          flex: 5,
                          wrap: true,
                        },
                        {
                          type: "text",
                          text: count + "点",
                          size: "sm",
                          color: "#555555",
                          flex: 1,
                        },
                        {
                          type: "button",
                          adjustMode: "shrink-to-fit",
                          margin: "xs",
                          action: {
                            type: "postback",
                            label: "変更",
                            data:
                              "action=orderCheck&orderCount=" +
                              count +
                              "&planId=" +
                              jsonData["menu"].filter((p) => p.name == key)[0]
                                .id,
                            displayText: "オーダー数変更",
                          },
                          flex: 2,
                        },
                        {
                          type: "text",
                          text:
                            (
                              parseInt(price, 10) * parseInt(count, 10)
                            ).toLocaleString() + "円",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                          flex: 2,
                          wrap: true,
                        },
                      ],
                    };
                  })
                  .concat([
                    {
                      type: "separator",
                      margin: "xxl",
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      margin: "xxl",
                      contents: [
                        {
                          type: "text",
                          text: "注文数",
                          size: "sm",
                          color: "#555555",
                        },
                        {
                          type: "text",
                          text: newPlanData.planId.length + "点",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "合計",
                          size: "sm",
                          color: "#555555",
                        },
                        {
                          type: "text",
                          text:
                            parseInt(
                              newPlanData.planPrice
                                ? newPlanData.planPrice.substring(1)
                                : "0"
                            ).toLocaleString() + "円",
                          size: "sm",
                          color: "#111111",
                          align: "end",
                        },
                      ],
                    },
                  ]),
              },
              {
                type: "separator",
                margin: "xxl",
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: "表示は税込価格",
                    size: "xs",
                    color: "#aaaaaa",
                    flex: 0,
                  },
                ],
              },
            ],
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "メニュー再表示",
                  text: "メニュー",
                },
              },
              {
                type: "button",
                style: "primary",
                action: {
                  type: "uri",
                  label: "個人情報入力",
                  uri: "https://liff.line.me/" + process.env.INFO_LIFF_ID,
                },
              },
            ],
          },
        },
      };
    } else if (action === "orderCheck") {
      const orderName = jsonData["menu"].filter((p) => p.id == planid)[0].name;
      echo = [
        {
          type: "text",
          text: orderName + "の変更後の注文数を選択してください",
        },
        {
          type: "flex",
          altText: "注文数変更画面を送信しました",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "horizontal",
              spacing: "md",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "0",
                    data: "action=changeOrder&orderCount=0&planId=" + planid,
                    displayText: "なし",
                  },
                },
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "1",
                    data: "action=changeOrder&orderCount=1&planId=" + planid,
                    displayText: "1つ",
                  },
                },
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "2",
                    data: "action=changeOrder&orderCount=2&planId=" + planid,
                    displayText: "2つ",
                  },
                },
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "3",
                    data: "action=changeOrder&orderCount=3&planId=" + planid,
                    displayText: "3つ",
                  },
                },
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "postback",
                    label: "4",
                    data: "action=changeOrder&orderCount=4&planId=" + planid,
                    displayText: "4つ",
                  },
                },
              ],
            },
          },
        },
      ];
    } else if (action === "changeOrder") {
      var plan = { planId: [], planName: [], planImageUrl: [], planPrice: 0 };

      if (cartData.exists) {
        plan = cartData.data();
      }
      const selData = jsonData["menu"].filter((p) => p.id == planid)[0];

      const count = plan.planId.filter((p) => p === planid).length;
      const diff = orderCount - count;

      const _planId = plan.planId
        .filter((p) => p !== planid)
        .concat([...Array(orderCount)].fill(planid));
      const _planName = plan.planName
        .filter((p) => p !== selData.name)
        .concat([...Array(orderCount)].fill(selData.name));
      const _planImageUrl = plan.planImageUrl
        .filter((p) => p !== selData.imageUrl)
        .concat([...Array(orderCount)].fill(selData.imageUrl));
      const _planPrice =
        "¥" +
        (parseInt(plan.planPrice.substring(1), 10) +
          diff * parseInt(selData.price.substring(1), 10));

      const newPlanData = {
        timestamp: new Date(),
        userId: event.source.userId,
        planId: _planId,
        planName: _planName,
        planImageUrl: _planImageUrl,
        planPrice: _planPrice,
      };

      // Saves the entity
      await database
        .collection("takeout_order")
        .doc(event.source.userId)
        .set(newPlanData);

      echo = {
        type: "flex",
        altText: "カート内容の確認",
        contents: {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "button",
                style: "secondary",
                action: {
                  type: "message",
                  label: "カートチェック",
                  text: "カートを確認",
                },
              },
            ],
          },
        },
      };
    } else if (action === "pay") {
      var price = "";
      if (cartData.exists) {
        price = cartData.data().planPrice;
      } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
      await database.collection("user").doc(event.source.userId).update({
        reservationTime: arrival,
      });
      if (price === "") {
        echo = {
          type: "text",
          text: "申し訳ありませんが、お返事できません。",
        };
      } else {
        // 申し込み内容確認のflex
        echo = {
          type: "flex",
          altText: "お支払い内容を送信しました。",
          contents: {
            type: "bubble",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "text",
                  text: "エッコ・エッコ上野店",
                  weight: "bold",
                  color: "#1DB446",
                  size: "sm",
                },
                {
                  type: "text",
                  text: "お支払い代金",
                  weight: "bold",
                  size: "xl",
                  margin: "md",
                },
                {
                  type: "separator",
                  margin: "xxl",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xxl",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: price,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xxl",
                  spacing: "sm",
                  contents: [],
                },
                {
                  type: "text",
                  text: "受け取り時間",
                  weight: "bold",
                  size: "xl",
                  margin: "md",
                },
                {
                  type: "separator",
                  margin: "xxl",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xxl",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: arrival,
                    },
                  ],
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  action: {
                    type: "uri",
                    label: "お支払い",
                    uri:
                      "https://liff.line.me/" +
                      process.env.LINEPAY_LIFF_ID +
                      "?userid=" +
                      event.source.userId,
                  },
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "xxl",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "※お支払い後のキャンセル対応は行っておりません。ご了承ください",
                      size: "md",
                      weight: "bold",
                      wrap: true,
                    },
                  ],
                },
              ],
            },
          },
        };
      }
      // クイックリプライ
    } else if (action === "questionnaire") {
      if (result === "yes") {
        echo = [
          {
            type: "text",
            text: "ありがとうございました。次回ご来店時にプレゼントがもらえるクーポンを差し上げます。ご利用ありがとうございました。",
          },
          {
            type: "flex",
            altText: "クーポンを送りました。",
            contents: {
              type: "bubble",
              header: {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "クーポンコード",
                    size: "xl",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: "XXXXXXXXXXXX",
                    size: "xxl",
                    weight: "bold",
                  },
                  {
                    type: "text",
                    text: "プレゼント引換券",
                    size: "xl",
                    weight: "bold",
                    color: "#ff0000",
                  },
                  {
                    type: "text",
                    text: "有効期限１年以内",
                  },
                ],
              },
            },
          },
        ];
      } else if (result === "no") {
        echo = {
          type: "text",
          text: "申し訳ありませんでした。改善に努めます。ご利用ありがとうございました。",
        };
      } else {
        echo = {
          type: "text",
          text: "申し訳ありませんが、お返事できません。",
        };
      }
    } else {
      echo = { type: "text", text: "申し訳ありませんが、お返事できません。" };
    }
  } else {
    echo = { type: "text", text: "申し訳ありませんが、お返事できません。" };
  }

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

const getPlanCarousel = async (jsonData) => {
  const planJsons = [];
  const randomAry = await funcRandom(
    jsonData.menu.filter((item) => item.id.length < 3)
  );
  for (let i = 0; i < Math.min(12, randomAry.length); i++) {
    planJsons.push(getPlanJson(jsonData.menu[randomAry[i]]));
  }
  return planJsons;
};

const getPlanJson = (data) => {
  // LIFFでプラン詳細
  const planLiff =
    "https://liff.line.me/" + process.env.PLAN_LIFF_ID + "/?planId=" + data.id;
  // jsonデータからプランを取得
  return {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: base_url + data.imageUrl,
      size: "full",
      aspectRatio: "4:3",
      aspectMode: "cover",
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "text",
          text: data.name,
          wrap: true,
        },
        {
          type: "box",
          layout: "baseline",
          contents: [
            {
              type: "text",
              text: data.price,
              wrap: true,
              weight: "bold",
              size: "xl",
              flex: 0,
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "secondary",
          action: {
            type: "uri",
            label: "詳細",
            uri: planLiff,
          },
        },
        {
          type: "button",
          style: "primary",
          action: {
            type: "postback",
            label: "カートに追加",
            data: "action=orderCount&planId=" + data.id,
            displayText: data.name,
          },
        },
      ],
    },
    styles: {
      header: {
        backgroundColor: "#000000",
      },
      hero: {
        separatorColor: "#000000",
      },
      footer: {
        separatorColor: "#000000",
      },
    },
  };
};

// ランダム
async function funcRandom(data) {
  let arr = [];
  for (let i = 0; i < data.length; i++) {
    arr[i] = i;
  }
  let a = arr.length;

  // ランダムアルゴリズム
  while (a) {
    let j = Math.floor(Math.random() * a);
    let t = arr[--a];
    arr[a] = arr[j];
    arr[j] = t;
  }

  // ランダムされた配列の要素を順番に表示する
  await arr.forEach(function (value) {});
  return arr;
}

const displayCount = (_data) => {
  var count = {};
  if (_data.planName) {
    const arr = _data.planName;
    for (var i = 0; i < arr.length; i++) {
      var elm = arr[i];
      count[elm] = (count[elm] || 0) + 1;
    }
  }
  return count;
};
