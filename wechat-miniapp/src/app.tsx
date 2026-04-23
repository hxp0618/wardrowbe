import { PropsWithChildren, useEffect } from "react";
import Taro, { useDidShow } from "@tarojs/taro";

import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth-storage";
import { fetchSessionUser } from "@/lib/session";

import "./app.scss";

function App({ children }: PropsWithChildren) {
  useEffect(() => {
    const token = Taro.getStorageSync<string>("wardrowbe_access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  useDidShow(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }
    void fetchSessionUser().catch((err) => {
      if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 401) {
        clearAccessToken();
        Taro.removeStorageSync("wardrowbe_access_token");
        const path = Taro.getCurrentInstance().router?.path || "";
        if (!path.includes("pages/login")) {
          Taro.reLaunch({ url: "/pages/login/index" });
        }
      }
    });
  });

  return children;
}

export default App;
