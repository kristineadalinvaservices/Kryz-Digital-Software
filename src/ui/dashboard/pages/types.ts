import type { StorageAdapter } from '../../../storage/adapter';
import type { StoreShape } from '../../../shared/types';
import type { Route } from '../App';

export interface PageProps {
  store: StoreShape;
  adapter: StorageAdapter;
  route: Route;
}
