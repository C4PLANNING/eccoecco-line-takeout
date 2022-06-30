const line = require("@line/bot-sdk");
const express = require("express");
const lineBot = require("./messagingAPI/lineBot");
const linePayConfirm = require("./linepay/linePayConfirm");
const linePayReserve = require("./linepay/linePayReserve");

// LINE BOTの設定
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "test",
  channelSecret: process.env.CHANNEL_SECRET || "test",
};

const app = new express();
const port = 8080;

// LINE PAY
app.get("/linepay/reserve", linePayReserve);
app.use("/linepay/confirm", linePayConfirm);

// LINE BOT
app.post("/linebot", line.middleware(config), lineBot);

// LIFF
app.use(express.static("liff"));
app.get("/info", function (req, res) {
  res.json({ id: process.env.INFO_LIFF_ID });
});

app.listen(port, () => console.log(`Server running on ${port}`));
