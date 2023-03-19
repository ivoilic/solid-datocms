declare module "solid" {
  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    fetchpriority?: "auto" | "low" | "high";
  }
}
