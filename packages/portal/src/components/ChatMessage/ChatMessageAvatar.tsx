import { MessageWithUserData } from '@/types';
import Link from 'next/link';
import AvatarWithFallback from '../AvatarWithFallback';

interface ChatMessageAvatarProps {
  user: MessageWithUserData['user'];
}

const ChatMessageAvatar = (props: ChatMessageAvatarProps) => {
  const { user } = props;

  return (
    <div className="mb-5 ml-1">
      <Link className="no-underline" href={`/users/${user.id}`}>
        <AvatarWithFallback
          size={40}
          imageUrl={user.avatarUrl}
          alt="profile image"
          name={user.name}
        ></AvatarWithFallback>
      </Link>
      {
        // Render moderator badge
        user.isMod ? (
          <div className="text-xs opacity-80 text-primary mt-1 mr-1 text-center">
            mod
          </div>
        ) : (
          <></>
        )
      }
    </div>
  );
};

export default ChatMessageAvatar;
