import { Platform } from 'react-native';

// Aubergine ink with rose thread and gold knots.
export const colors = {
  ink: '#15111F',
  wool: '#231B33',
  fiber: '#3A2E52',
  thread: '#F2A7C3',
  knot: '#F6D186',
  mist: '#B9AFD0',
  paper: '#F5EFFA',
  alert: '#FF9C9C',
};

export const fonts = {
  display: Platform.select({ ios: 'Georgia', default: 'serif' }) as string,
};
