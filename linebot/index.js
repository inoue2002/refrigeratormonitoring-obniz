//LINEBot
//Lambda関数
"use strict";
// モジュール呼び出し
const crypto = require("crypto");
const line = require("@line/bot-sdk");
const { Client } = require("@notionhq/client");
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// インスタンス生成
const lineClient = new line.Client({
  channelAccessToken: process.env.ACCESSTOKEN,
});

exports.handler = (event) => {
  let signature = crypto
    .createHmac("sha256", process.env.CHANNELSECRET)
    .update(event.body)
    .digest("base64");
  let checkHeader = (event.headers || {})["X-Line-Signature"];
  if (!checkHeader) {
    checkHeader = (event.headers || {})["x-line-signature"];
  }

  const body = JSON.parse(event.body);
  const events = body.events;
  console.log(events);

  // 署名検証が成功した場合
  if (signature === checkHeader) {
    events.forEach(async (event) => {
      let message;
      switch (event.type) {
        case "message":
          message = await messageFunc(event);
          break;
        case "postback":
          message = await postbackFunc(event);
          break;
        case "follow":
          message = { type: "text", text: "追加ありがとうございます！" };
          break;
      }
      // メッセージを返信
      if (message != undefined) {
        await sendFunc(body.events[0].replyToken, message);
        // .then(console.log)
        // .catch(console.log);
        return;
      }
    });
  }
  // 署名検証に失敗した場合
  else {
    console.log("署名認証エラー");
  }
};

async function sendFunc(replyToken, mes) {
  const result = new Promise(function (resolve, reject) {
    lineClient.replyMessage(replyToken, mes).then((response) => {
      resolve("送信完了");
    });
  });
  return result;
}

async function messageFunc(event) {
  let message = "";
  message = { type: "text", text: `メッセージイベント` };
  let headerMes = event.message.text.split("/");
  if (event.message.text === "買いました報告") {
    //現在wantになっている商品をカルーセルで一覧にする

    const request_payload = {
      path: "databases/" + "c98d166221914e1a92f4e7a90761c0da" + "/query",
      method: "POST",
      body: {
        filter: {
          property: `want`,
          checkbox: {
            equals: true,
          },
        },
      },
    };
    const current_pages = await notion.request(request_payload);
    const wantItemsArry = [];
    for (const item of current_pages.results) {
      wantItemsArry.push({
        type: "bubble",
        direction: "ltr",
        header: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `${item.properties.item.title[0].plain_text}`,
              weight: "bold",
              size: "xxl",
              color: "#626C62FF",
              align: "center",
              wrap: true,
              contents: [],
            },
            {
              type: "separator",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "button",
              action: {
                type: "postback",
                label: "購入した",
                data: `${item.properties.item.title[0].plain_text}/${item.id}`,
              },
              style: "primary",
            },
          ],
        },
      });
    }
    message = {
      type: "flex",
      altText: "現在買って欲しいリストです",
      contents: {
        type: "carousel",
        contents: wantItemsArry,
      },
    };

    //ポストバックに 項目名/id
  } else if (event.message.text === "欲しいです報告") {
  } else if (headerMes.length === 2) {
    if (headerMes[0] === "追加")
      message = { type: "text", text: `${headerMes[1]}を追加しました` };
  } else {
    message = {
      type: "text",
      text: "「買いました報告」か「欲しいです報告」のどちらかを送ってください。",
    };
  }
  return message;
}
const postbackFunc = async function (event) {
  let message = "";
  message = { type: "text", text: "ポストバックイベント" };
  const headerData = event.postback.data.split("/");
  message = { type: "text", text: `${headerData[0]}の購入を保存しました！` };
  //wantをfalseに切り替える
  const request_payload = {
    path: "pages/" + headerData[1],
    method: "patch",
    body: {
      parent: { database_id: "c98d166221914e1a92f4e7a90761c0da" },
      properties: {
        item: {
          title: [
            {
              text: {
                content: headerData[0],
              },
            },
          ],
        },
        want: {
          checkbox: false,
        },
      },
    },
  };
  await notion.request(request_payload);

  return message;
};
