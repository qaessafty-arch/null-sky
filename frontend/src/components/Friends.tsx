// FILE: frontend/src/components/Friends.tsx
import React from 'react';
import { FriendsView } from './FriendsView';

export { FriendsView as Friends };
export default function Friends(props: any) {
  return <FriendsView {...props} />;
}
