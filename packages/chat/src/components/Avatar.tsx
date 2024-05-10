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
    <Avatar
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <AvatarImage src={imageUrl || undefined} alt={alt} />
      <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
    </Avatar>
  );
};

export default AvatarWithFallback;
