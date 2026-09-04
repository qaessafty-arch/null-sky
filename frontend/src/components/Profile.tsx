// FILE: frontend/src/components/Profile.tsx
import React from 'react';
import { ProfileView } from './ProfileView';

export { ProfileView as Profile };
export default function Profile(props: any) {
  return <ProfileView {...props} />;
}
