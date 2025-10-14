import { useContainer } from 'unstated-next';
import { AuthContainer } from '../store/containers/AuthContainer';

export const useAuth = () => {
  return useContainer(AuthContainer);
};