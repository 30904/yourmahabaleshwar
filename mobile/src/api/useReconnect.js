import { useEffect } from 'react';
import { subscribeReconnect } from './network';

export function useReconnect(onReconnect) {
    useEffect(() => subscribeReconnect(() => {
        onReconnect();
    }), [onReconnect]);
}
