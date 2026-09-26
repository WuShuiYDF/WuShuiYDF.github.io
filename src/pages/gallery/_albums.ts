// 相册静态路径：从 gallery.json 生成 [key] 页面的 props（index.astro 与 [key].astro 共用类型）
import galleryJson from '../../data/gallery.json';

interface GalleryGroup {
  key: string;
  title: string;
  description?: string;
  cover?: string;
  images: { alt?: string; url: string }[];
}

export function getStaticPaths() {
  return (galleryJson as GalleryGroup[])
    .filter((g) => g.images.length > 0)
    .map((album) => ({ params: { key: album.key }, props: { album } }));
}
