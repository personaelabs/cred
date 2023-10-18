import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Image from 'next/image';

type FcAvatarProps = {
  image: string;
};

export const FcAvatar = (props: FcAvatarProps) => {
  return (
    <Avatar>
      <Image
        src={props.image}
        fill
        alt="User Avatar"
        className="rounded-full border-2 border-gray-600"
      />
      <AvatarFallback>FC</AvatarFallback>
    </Avatar>
  );
};
