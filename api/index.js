//Notionに記録するAPI
//Lambda関数

const { Client } = require("@notionhq/client");
// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

exports.handler = async (e) => {
  console.log(e.path);
  console.log(e.body);
  const event = JSON.parse(e.body);
  let message = "";
  switch (e.path) {
    case "/register":
      message = "ok";
      //notionAPIを叩いて、今日の冷蔵庫が開いた回数と時間を取得する
      await registerFunc(event);
      break;
    case "/result":
      //cronで毎日24時に動く
      //１日の結果をグループラインに送ってくれる
      //notionの計測が初期化される。
      //購入の必要があるものも教えてくれる
      break;
  }

  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(message),
  };
  return response;
};

async function registerFunc(event) {
  const request_payload = {
    path: "databases/" + "fb9bd269-8888-4fa1-a07a-83817ce9ffb9" + "/query",
    method: "POST",
  };
  const current_pages = await notion.request(request_payload);
  let todayCount = {};
  let todayTime = {};
  for (const page of current_pages.results) {
    if (page.id === "07ce4234-d2d3-43be-ba8d-18be7bec2b58") {
      todayCount = { id: page.id, count: page.properties.count.number };
    }
    if (page.id === "9217cbb3-0a20-4fc0-9778-31d0002f200c") {
      todayTime = { id: page.id, count: page.properties.count.number };
    }
  }
  todayCount.count = todayCount.count + 1;
  todayTime.count = todayTime.count + event.totalTime;
  await notionUpdateCount(todayCount, todayTime);
}
async function notionUpdateCount(todayCount, todayTime) {
  const request_payload = {
    path: "pages/" + todayCount.id,
    method: "patch",
    body: {
      parent: {
        database_id:
          "fb9bd269-8888-4fa1-a07a-83817ce9ffb9fb9bd269-8888-4fa1-a07a-83817ce9ffb9",
      },
      properties: {
        冷蔵庫: {
          title: [
            {
              text: {
                content: "本日開いた回数",
              },
            },
          ],
        },
        count: {
          number: todayCount.count,
        },
        id: {
          rich_text: [
            {
              text: {
                content: todayCount.id,
              },
            },
          ],
        },
      },
    },
  };
  await notion.request(request_payload);

  const request_payload2 = {
    path: "pages/" + todayTime.id,
    method: "patch",
    body: {
      parent: {
        database_id:
          "fb9bd269-8888-4fa1-a07a-83817ce9ffb9fb9bd269-8888-4fa1-a07a-83817ce9ffb9",
      },
      properties: {
        冷蔵庫: {
          title: [
            {
              text: {
                content: "本日開いた時間",
              },
            },
          ],
        },
        count: {
          number: todayTime.count,
        },
        id: {
          rich_text: [
            {
              text: {
                content: todayTime.id,
              },
            },
          ],
        },
      },
    },
  };
  await notion.request(request_payload2);
}
