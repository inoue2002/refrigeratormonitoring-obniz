//Notionに記録するAPI
//Lambda関数

const { Client } = require("@notionhq/client");
const axios = require("axios");
const querystring = require("querystring");
// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

exports.handler = async (e) => {
  console.log(e.path);
  console.log(e.body);
  const event = e.body;
  let message = "";
  switch (e.path) {
    case "/register":
      message = "ok";
      await registerFunc(JSON.parse(event));
      break;
    case "/cron":
      await cronFunc();
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

async function cronFunc() {
  //今のセンサーのあたいを取得しにいく
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
  //今家で必要なものを取得しにいく
  const request_payload2 = {
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
  const current_pages2 = await notion.request(request_payload2);
  let wantItems = "\n【現在この家に必要なものリスト】";
  for (const item of current_pages2.results) {
    wantItems =
      wantItems + "\n" + "・" + item.properties.item.title[0].plain_text;
  }

  await axios.post(
    "https://notify-api.line.me/api/notify",
    querystring.stringify(
      {
        message: `本日は冷蔵庫が！${todayCount.count}回開けられ、開いていた時間は${todayTime.count}秒でした。明日はもっと短くなるように心がけましょう。`,
      },
    ),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.NOTIFY_TOKEN}`,
      },
    }
  );
  await axios.post(
    "https://notify-api.line.me/api/notify",
    querystring.stringify(
      {
        message: `${wantItems}\n編集:https://lin.ee/PgZiEkV`,
      },
    ),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.NOTIFY_TOKEN}`,
      },
    }
  );

  todayCount.count = 0;
  todayTime.count = 0;
  await notionUpdateCount(todayCount, todayTime);
  //LINEに投げる
}
