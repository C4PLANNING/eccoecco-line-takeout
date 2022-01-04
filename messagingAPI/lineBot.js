"use strict";

const line = require("@line/bot-sdk");

const firebase = require("firebase");
require("firebase/firestore");
require("firebase/storage");

const menuData = require("./menuData");
const database = firebase.firestore();
const storageRef = firebase.storage().ref();
global.XMLHttpRequest = require("xhr2");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "test",
  channelSecret: process.env.CHANNEL_SECRET || "test",
};

const base_url = process.env.BASE_URL;
// 特商法表記
const commerceLiff = "https://liff.line.me/" + process.env.COMMERCE_LIFF_ID;
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
    if (event.message.text.substring(0, 4) === "メニュー") {
      // 2021-10-02新規
      //　タイプ毎にメニュー表示に反抗
      echo = {
        type: "text",
        text: "お好きなタイプを選択してください",
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "あっさり塩味系",
                data: "action=menuByType&menuType=Lightly_Salty",
                displayText: "あっさり塩味系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "バジルソース系",
                data: "action=menuByType&menuType=Basil_Sauce",
                displayText: "バジルソース系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "トマト系",
                data: "action=menuByType&menuType=Tomato",
                displayText: "トマト系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "ナポリタン系",
                data: "action=menuByType&menuType=Neapolitan",
                displayText: "ナポリタン系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "和風しょうゆ系",
                data: "action=menuByType&menuType=Japanese_Flavor",
                displayText: "和風しょうゆ系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "クリーム系",
                data: "action=menuByType&menuType=Cream",
                displayText: "クリーム系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "たらこ系",
                data: "action=menuByType&menuType=Tarako",
                displayText: "たらこ系",
              },
            },
          ],
        },
      };
    } else if (event.message.text.substring(0, 3) === "カート") {
      var _data = {};
      if (cartData.exists) {
        _data = cartData.data();
      } else {
        // doc.data() will be undefined in this case
        echo = {
          type: "text",
          text: "エラー番号(200)。\n恐れ入りますが、店舗までエラー番号をご連絡ください。",
        };
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
              {
                type: "box",
                layout: "vertical",
                margin: "md",
                contents: [
                  {
                    type: "button",
                    style: "link",
                    adjustMode: "shrink-to-fit",
                    margin: "xs",
                    action: {
                      type: "uri",
                      label: "特定商取引法に基づく表記はこちら",
                      uri: commerceLiff,
                    },
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
    } else if (event.message.text.substring(0, 5) === "お申し込み") {
      var price = "";
      if (cartData.exists) {
        price = cartData.data().planPrice;
      } else {
        // doc.data() will be undefined in this case
        echo = {
          type: "text",
          text: "エラー番号(300)。\n恐れ入りますが、店舗までエラー番号をご連絡ください。",
        };
        console.log("No such document!");
      }
      var arrival = "";
      const userData = await database
        .collection("user")
        .doc(event.source.userId)
        .get();
      if (userData.exists) {
        arrival = userData.data().reservationTime;
      }
      if (price === "" || arrival === "") {
        echo = {
          type: "text",
          text: "カートが空か、時間の指定が無効です。再度お試しください。",
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
                    label: "LINE Payでお支払い",
                    uri:
                      "https://liff.line.me/" +
                      process.env.LINEPAY_LIFF_ID +
                      "?userid=" +
                      event.source.userId,
                  },
                },
                // {
                //   type: "button",
                //   style: "primary",
                //   color: "#fe0034",
                //   action: {
                //     type: "uri",
                //     label: "PayPayでお支払い",
                //     uri:
                //       "https://liff.line.me/" +
                //       process.env.PAYPAY_LIFF_ID +
                //       "?userid=" +
                //       event.source.userId,
                //   },
                // },
                {
                  type: "box",
                  layout: "horizontal",
                  spacing: "md",
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
    } else {
      echo = { type: "text", text: "申し訳ありませんが、お返事できません。" };
    }
  } else if (event.type === "follow") {
    echo = [
      {
        type: "text",
        text: "メニューはこちらです",
      },
      {
        type: "text",
        text: "お好きなタイプを選択してください",
        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "あっさり塩味系",
                data: "action=menuByType&menuType=Lightly_Salty",
                displayText: "あっさり塩味系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "バジルソース系",
                data: "action=menuByType&menuType=Basil_Sauce",
                displayText: "バジルソース系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "トマト系",
                data: "action=menuByType&menuType=Tomato",
                displayText: "トマト系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "ナポリタン系",
                data: "action=menuByType&menuType=Neapolitan",
                displayText: "ナポリタン系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "和風しょうゆ系",
                data: "action=menuByType&menuType=Japanese_Flavor",
                displayText: "和風しょうゆ系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "クリーム系",
                data: "action=menuByType&menuType=Cream",
                displayText: "クリーム系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "たらこ系",
                data: "action=menuByType&menuType=Tarako",
                displayText: "たらこ系",
              },
            },
          ],
        },
      },
    ];
  } else if (event.type === "postback") {
    // 埋め込みデータ取得
    const data = new URLSearchParams(event.postback.data);
    const action = data.get("action");
    const result = data.get("result");
    const planid = data.get("planId");
    const initialize = data.get("initialize");
    const orderCount = parseInt(data.get("orderCount"), 10);
    // 2021-10-02新規
    //　タイプ毎にメニュー表示に反抗
    const menuType = data.get("menuType");

    if (action === "menuByType") {
      echo = {
        type: "flex",
        altText: "メニューを送信しました。",
        contents: {
          type: "carousel",
          contents: await getPlanCarousel(jsonData, menuType),
        },

        quickReply: {
          items: [
            {
              type: "action",
              action: {
                type: "postback",
                label: "あっさり塩味系",
                data: "action=menuByType&menuType=Lightly_Salty",
                displayText: "あっさり塩味系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "バジルソース系",
                data: "action=menuByType&menuType=Basil_Sauce",
                displayText: "バジルソース系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "トマト系",
                data: "action=menuByType&menuType=Tomato",
                displayText: "トマト系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "ナポリタン系",
                data: "action=menuByType&menuType=Neapolitan",
                displayText: "ナポリタン系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "和風しょうゆ系",
                data: "action=menuByType&menuType=Japanese_Flavor",
                displayText: "和風しょうゆ系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "クリーム系",
                data: "action=menuByType&menuType=Cream",
                displayText: "クリーム系",
              },
            },
            {
              type: "action",
              action: {
                type: "postback",
                label: "たらこ系",
                data: "action=menuByType&menuType=Tarako",
                displayText: "たらこ系",
              },
            },
          ],
        },
      };
    }
    // プランデータ申込（選択1 注文数、選択2 大盛り選択、選択3 半熟たまご）
    else if (action === "orderCount") {
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

const getPlanCarousel = async (jsonData, menuType) => {
  const planJsons = [];
  const arr = [];
  if (menuType) {
    jsonData.menu
      .filter((item) => item.imageUrl.includes(menuType))
      .filter((item) => item.id.length < 3)
      .forEach((item) => arr.push(item));
  } else {
    jsonData.menu
      .filter((item) => item.id.length < 3)
      .forEach((item) => arr.push(item));
  }
  for (let i = 0; i < Math.min(12, arr.length); i++) {
    planJsons.push(getPlanJson(arr[i]));
  }
  return planJsons;
};

const getPlanJson = (data) => {
  // LIFFでプラン詳細
  const planLiff =
    "https://liff.line.me/" + process.env.PLAN_LIFF_ID + "/?planId=" + data.id;
  // jsonデータからプランを取得
  const url =
    "https://storage.googleapis.com/eccoecco-line-takeout.appspot.com";
  return {
    type: "bubble",
    size: "kilo",
    hero: {
      type: "image",
      url: url + data.imageUrl,
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
        // {
        //   type: "button",
        //   style: "secondary",
        //   action: {
        //     type: "uri",
        //     label: "詳細",
        //     uri: planLiff,
        //   },
        // },
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
