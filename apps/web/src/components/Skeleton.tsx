type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = 'h-3 w-full' }: SkeletonProps) => (
  <div className={`animate-sweep rounded-xs bg-line ${className}`} />
);
