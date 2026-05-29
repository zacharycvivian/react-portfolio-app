"use client";
import React, { useState } from "react";
import Image from "next/image";
import styles from "./AvatarImage.module.css";

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size: number;
  className?: string;
  unoptimized?: boolean;
}

export default function AvatarImage({ src, alt, size, className, unoptimized }: AvatarImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`${styles.wrapper} ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {!loaded && <div className={styles.shimmer} />}
      <Image
        src={src || "/defaultavatar.jpg"}
        alt={alt}
        width={size}
        height={size}
        className={styles.img}
        style={{ opacity: loaded ? 1 : 0, width: size, height: size }}
        onLoad={() => setLoaded(true)}
        unoptimized={unoptimized}
      />
    </div>
  );
}
