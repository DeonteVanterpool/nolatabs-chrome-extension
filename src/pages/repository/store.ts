export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/* This is an intermediary type between app level types and storage types */
export abstract class Store<Model, StorageObject extends JsonValue> {
    abstract deserialize(object: StorageObject): Model;
    abstract serialize(model: Model): StorageObject;
};
