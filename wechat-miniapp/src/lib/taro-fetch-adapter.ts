import Taro from "@tarojs/taro";

import type { FetchAdapter } from "@wardrowbe/shared-api/src/adapters/fetch-adapter";

export const taroFetchAdapter: FetchAdapter = async (req) => {
  const res = await Taro.request({
    url: req.url,
    method: req.method,
    header: req.headers,
    data: req.body !== undefined ? JSON.parse(req.body) : undefined,
  });
  return {
    status: res.statusCode,
    json: async () => res.data,
  };
};
