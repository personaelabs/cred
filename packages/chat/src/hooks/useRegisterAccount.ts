import db from '@/lib/firestore';
import { SignedInUser } from '@/types';
import { User, userConverter } from '@cred/shared';
import { useMutation } from '@tanstack/react-query';
import { collection, doc, setDoc } from 'firebase/firestore';

const registerAccount = async (user: SignedInUser) => {
  const usersRef = collection(db, 'users').withConverter(userConverter);

  const userDoc = doc(usersRef, user.id);

  const userData: User = {
    id: user.id,
    username: user.username || '',
    displayName: user.displayName || '',
    pfpUrl: user.pfpUrl || '',
  };

  await setDoc(userDoc, userData);
};

const useRegisterAccount = () => {
  return useMutation({
    mutationFn: async (user: SignedInUser) => {
      await registerAccount(user);
    },
  });
};

export default useRegisterAccount;
