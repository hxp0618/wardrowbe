/** Chinese labels aligned with `packages/shared-i18n/locale/zh.json` → `taxonomy.types/subtypes`. */

export const CLOTHING_TYPE_ZH: Record<string, string> = {
  shirt: "衬衫",
  "t-shirt": "T 恤",
  top: "上衣",
  polo: "Polo 衫",
  blouse: "女式衬衫",
  "tank-top": "背心",
  sweater: "毛衣",
  hoodie: "连帽衫",
  cardigan: "开衫",
  vest: "马甲",
  pants: "长裤",
  jeans: "牛仔裤",
  shorts: "短裤",
  skirt: "半身裙",
  dress: "连衣裙",
  jumpsuit: "连体裤",
  jacket: "夹克",
  blazer: "西装外套",
  coat: "大衣",
  suit: "套装",
  shoes: "鞋",
  sneakers: "运动鞋",
  boots: "靴子",
  sandals: "凉鞋",
  socks: "袜子",
  tie: "领带",
  hat: "帽子",
  scarf: "围巾",
  belt: "腰带",
  bag: "包",
  accessories: "配饰",
};

/** Common subtypes; unknown keys fall back to the raw subtype string. */
export const CLOTHING_SUBTYPE_ZH: Record<string, string> = {
  oxford: "牛津纺",
  flannel: "法兰绒",
  chinos: "斜纹裤",
  joggers: "束脚裤",
  cargo: "工装裤",
  crewneck: "圆领",
  turtleneck: "高领",
  v_neck: "V领",
  loafers: "乐福鞋",
  sneakers: "运动鞋",
};

export function clothingTypeZh(type: string): string {
  return CLOTHING_TYPE_ZH[type] || type;
}

export function clothingSubtypeZh(subtype: string | null | undefined): string {
  if (!subtype) return "";
  const k = subtype.toLowerCase();
  return CLOTHING_SUBTYPE_ZH[k] || subtype;
}

/** Aligned with `packages/shared-i18n/locale/zh.json` → `taxonomy.occasions`. */
export const OCCASION_LABEL_ZH: Record<string, string> = {
  casual: "休闲",
  office: "办公",
  formal: "正式",
  date: "约会",
  sporty: "运动",
  outdoor: "户外",
};

export function occasionLabelZh(value: string): string {
  return OCCASION_LABEL_ZH[value] || value;
}
