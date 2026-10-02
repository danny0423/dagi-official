import Image from "next/image";
import { PlaceholderText } from "@/components/placeholder-text";

type PhotoProps = {
  description: string;
  className?: string;
  sizes?: string;
  photo?: { src: string; alt: string };
};

export function PhotoPlaceholder({ description, className = "", sizes = "(max-width: 767px) 100vw, 60vw", photo }: PhotoProps) {
  return (
    <div className={`photo-placeholder concrete ${className}`}>
      {photo ? (
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="site-photo" />
      ) : (
        <span className="photo-placeholder-caption"><PlaceholderText text={`【待填：${description}】`} /></span>
      )}
    </div>
  );
}
