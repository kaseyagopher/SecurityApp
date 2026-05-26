import type { Href } from 'expo-router';

const href = (path: string) => path as Href;

/** Routes — expo-router regénère les types au `npx expo start` */
export const Routes = {
  home: href('/(tabs)'),
  door: href('/(tabs)/door'),
  history: href('/(tabs)/history'),
  alarm: href('/(tabs)/alarm'),
  profile: href('/(tabs)/profile'),
  users: href('/(tabs)/users'),
  enroll: href('/(tabs)/enroll'),
  login: href('/(auth)/login'),
};
