type ImageLike = {
  image_url?: string | null
  medium_url?: string | null
  thumbnail_url?: string | null
}

type ItemImageSet = ImageLike & {
  additional_images?: ImageLike[] | null
}

export function getDisplayImageUrl(image: ImageLike | null | undefined): string | null {
  return image?.thumbnail_url || image?.medium_url || image?.image_url || null
}

export function getPreviewImageUrl(image: ImageLike | null | undefined): string | null {
  return image?.image_url || image?.medium_url || image?.thumbnail_url || null
}

export function getItemPreviewUrls(item: ItemImageSet): string[] {
  return uniqueUrls([
    getPreviewImageUrl(item),
    ...(item.additional_images ?? []).map((image) => getPreviewImageUrl(image)),
  ])
}

export function getOutfitPreviewUrls(items: ImageLike[]): string[] {
  return uniqueUrls(items.map((item) => getPreviewImageUrl(item)))
}

function uniqueUrls(urls: Array<string | null>): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const url of urls) {
    if (!url || seen.has(url)) continue
    seen.add(url)
    result.push(url)
  }

  return result
}
