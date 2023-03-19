import { createSignal, onCleanup, createEffect } from 'solid-js';
import {
  subscribeToQuery,
  UnsubscribeFn,
  ChannelErrorData,
  ConnectionStatus,
  Options,
} from 'datocms-listen';

export type SubscribeToQueryOptions<QueryResult, QueryVariables> = Omit<
  Options<QueryResult, QueryVariables>,
  'onStatusChange' | 'onUpdate' | 'onChannelError'
>;

export type EnabledQueryListenerOptions<QueryResult, QueryVariables> = {
  /** Whether the subscription has to be performed or not */
  enabled?: true;
  /** The initial data to use while the initial request is being performed */
  initialData?: QueryResult;
} & SubscribeToQueryOptions<QueryResult, QueryVariables>;

export type DisabledQueryListenerOptions<QueryResult, QueryVariables> = {
  /** Whether the subscription has to be performed or not */
  enabled: false;
  /** The initial data to use while the initial request is being performed */
  initialData?: QueryResult;
} & Partial<SubscribeToQueryOptions<QueryResult, QueryVariables>>;

export type QueryListenerOptions<QueryResult, QueryVariables> =
  | EnabledQueryListenerOptions<QueryResult, QueryVariables>
  | DisabledQueryListenerOptions<QueryResult, QueryVariables>;

export function useQuerySubscription<QueryResult = any, QueryVariables = Record<string, any>>(
  options: QueryListenerOptions<QueryResult, QueryVariables>
) {
  const { enabled, initialData, ...other } = options;

  const [error, setError] = createSignal<ChannelErrorData | null>(null);
  const [data, setData] = createSignal<QueryResult | null>(null);
  const [status, setStatus] = createSignal<ConnectionStatus>(enabled ? 'connecting' : 'closed');

  const subscribeToQueryOptions = other as EnabledQueryListenerOptions<QueryResult, QueryVariables>;

  createEffect(() => {
    if (enabled === false) {
      setStatus('closed');

      return () => {
        // we don't have to perform any uninstall
      };
    }

    let unsubscribe: UnsubscribeFn | null;

    async function subscribe() {
      unsubscribe = await subscribeToQuery<QueryResult, QueryVariables>({
        ...subscribeToQueryOptions,
        onStatusChange: (status) => {
          setStatus(status);
        },
        onUpdate: (updateData) => {
          setError(null);
          setData(updateData.response.data);
        },
        onChannelError: (errorData) => {
          setData(null);
          setError(errorData);
        },
      });
    }

    subscribe();

    onCleanup(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });
  });

  return { error, status, data: data || initialData };
}
