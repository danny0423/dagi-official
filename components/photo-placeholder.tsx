import Image from "next/image";
import { PlaceholderText } from "@/components/placeholder-text";

type PhotoProps = {
  description: string;
  className?: string;
  sizes?: string;
  photo?: { src: string; alt: string };
  /**
   * 只給首屏主視覺（LCP 元素）用：改成立即載入並提高下載優先順序。
   * Next 16 已棄用 priority，文件建議 LCP 圖用 loading="eager" 或 fetchPriority="high"（不要再加 preload）。
   * 其他照片不要設定，維持 next/image 預設的 lazy 載入。
   */
  lcp?: boolean;
};

export function PhotoPlaceholder({ description, className = "", sizes = "(max-width: 767px) 100vw, 60vw", photo, lcp = false }: PhotoProps) {
  return (
    <div className={`photo-placeholder concrete ${className}`}>
      {photo ? (
        // 後台上傳的圖片：本機儲存是 /media/...（站內路徑，照常最佳化）；S3 是完整網址，
        // 還沒設定 next.config 的 images.remotePatterns（S3 尚未實測，D16），先不經過 Next 圖片最佳化。
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="site-photo"
          unoptimized={/^https?:\/\//.test(photo.src)}
          loading={lcp ? "eager" : undefined} fetchPriority={lcp ? "high" : undefined} />
      ) : (
        // 上線檢查（scripts/check-launch.ts）會在使用處抓「沒有 photo 的 PhotoPlaceholder」，這行本身略過。
        <span className="photo-placeholder-caption"><PlaceholderText text={`【待填：${description}】`} /></span> // check-launch: ignore
      )}
    </div>
  );
}
