import clsx from "clsx";

interface Props {
  className?: string;
}

export function SkeletonBlock({ className }: Props) {
  return (
    <div
      className={clsx(
        "bg-gray-100 rounded-xl animate-pulse",
        className
      )}
    />
  );
}
