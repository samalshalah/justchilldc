import Image from "next/image";
import { imageVariantSrcSet, imageVariantUrl } from "@/lib/image-variants";

interface Props {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({ src, alt, sizes, className, priority = false }: Props) {
  const srcSet = imageVariantSrcSet(src);
  if (!srcSet) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />;
  }
  return (
    <img
      src={imageVariantUrl(src, 640)}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`absolute inset-0 h-full w-full ${className ?? ""}`}
    />
  );
}
