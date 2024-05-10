import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/* eslint-disable @next/next/no-img-element */
interface AvatarProps {
  imageUrl: string | null;
  size: number;
  alt: string;
  name: string;
}

const AvatarWithFallback = (props: AvatarProps) => {
  const { imageUrl, size, alt, name } = props;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <Avatar className="w-full h-full">
        <AvatarImage
          src={imageUrl || undefined}
          alt={alt}
          className={`rounded-full object-cover`}
        />
        <AvatarFallback delayMs={1200}>{name.slice(0, 2)}</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default AvatarWithFallback;
