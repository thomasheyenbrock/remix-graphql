export type ArrayItem<T> = T extends Array<infer S> ? S : never;
