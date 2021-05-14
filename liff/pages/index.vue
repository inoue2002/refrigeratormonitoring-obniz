<template>
  <div>
    <v-row justify="center" style="margin-top: 50px">
      <div class="mt-6" align="center">
        <h3>欲しいものをリスト追加する</h3>
        <v-text-field
          label="商品名"
          v-model="item"
          style="margin-top: 40px"
          solo
        >
        </v-text-field>
        <v-btn color="success" elevation="3" @click="register" large
          >追加</v-btn
        >
      </div>
    </v-row>
  </div>
</template>


<script>
export default {
  data: () => ({
    item: "",
  }),
  async mounted() {
    liff
      .init({
        liffId: "1655989367-pax2zN0P",
      })
      .then(() => {
        this.isLoggedIn = liff.isLoggedIn();
        if (!liff.isInClient() && !liff.isLoggedIn()) {
          liff.login();
        }
      });
  },
  methods: {
    register() {
      liff
        .sendMessages([
          {
            type: "text",
            text: `追加/${this.item}`,
          },
        ])
        .then(() => {
          console.log("message sent");
          liff.closeWindow();
        })
        .catch((err) => {
          console.log("error", err);
        });
    },
  },
};
</script>
