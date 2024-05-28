import { SnapshotOptions, DocumentData } from 'firebase/firestore';
import { UserCreddd } from '../types';

export const userCredddConverter = {
  toFirestore: (userCreddd: UserCreddd) => {
    return {
      userId: userCreddd.userId,
      creddd: userCreddd.creddd,
    };
  },
  fromFirestore: (doc: DocumentData, options?: SnapshotOptions) => {
    const data = doc.data(options)!;

    const user: UserCreddd = {
      userId: data.userId,
      creddd: data.creddd,
    };

    return user;
  },
};
