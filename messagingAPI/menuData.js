const firebase = require("firebase");
require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
};

firebase.initializeApp(firebaseConfig);
const database = firebase.firestore();

async function createData() {
  const menuData = await database.collection("items").get();
  let data = { menu: [] };
  let extra = 0;
  let eggplus = 0;
  menuData.forEach((doc) => {
    const item = doc.data();
    if (item.type === "料理" && item.stock) {
      data.menu.push({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        egg: item.egg,
      });
    } else if (
      item.type === "オプション" &&
      item.name === "大盛り" &&
      item.stock
    ) {
      extra = parseInt(item.price.substring(1), 10);
    } else if (
      item.type === "オプション" &&
      item.name === "半熟たまご" &&
      item.stock
    ) {
      eggplus = parseInt(item.price.substring(1), 10);
    }
  });
  const rawData = Array.from(data.menu);
  rawData.forEach((item) => {
    data.menu.push({
      id: "" + (parseInt(item.id, 10) + 100),
      name: item.name + "（大盛り）",
      imageUrl: item.imageUrl,
      price: "¥" + (parseInt(item.price.substring(1), 10) + extra),
      egg: item.egg,
    });
  });
  rawData.forEach((item) => {
    if (item.egg) {
      data.menu.push({
        id: "" + (parseInt(item.id, 10) + 200),
        name: item.name + "（半熟たまご追加）",
        imageUrl: item.imageUrl,
        price: "¥" + (parseInt(item.price.substring(1), 10) + eggplus),
        egg: item.egg,
      });
    }
  });
  rawData.forEach((item) => {
    if (item.egg) {
      data.menu.push({
        id: "" + (parseInt(item.id, 10) + 300),
        name: item.name + "（大盛り、半熟たまご追加）",
        imageUrl: item.imageUrl,
        price: "¥" + (parseInt(item.price.substring(1), 10) + eggplus + extra),
        egg: item.egg,
      });
    }
  });
  return data;
}

exports.createData = createData;
