export default {
  pages: [
    "pages/login/index",
    "pages/dashboard/index",
    "pages/wardrobe/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#1a1a1a",
    navigationBarTitleText: "Wardrowbe",
    navigationBarTextStyle: "white",
  },
  tabBar: {
    color: "#888888",
    selectedColor: "#e8b4a0",
    backgroundColor: "#1a1a1a",
    borderStyle: "black",
    list: [
      {
        pagePath: "pages/dashboard/index",
        text: "首页",
        iconPath: "assets/tab/home.png",
        selectedIconPath: "assets/tab/home-active.png",
      },
      {
        pagePath: "pages/wardrobe/index",
        text: "衣橱",
        iconPath: "assets/tab/wardrobe.png",
        selectedIconPath: "assets/tab/wardrobe-active.png",
      },
    ],
  },
};
