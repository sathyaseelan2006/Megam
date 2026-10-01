/**
 * Functional Type-Safe Result Monad for robust error handling without unchecked exceptions.
 */

export type Ok<T> = {
  readonly ok: true;
  readonly value: T;
};

export type Err<E> = {
  readonly ok: false;
  readonly error: E;
};

export type Result<T, E = Error> = Ok<T> | Err<E>;

export const Ok = <T>(value: T): Ok<T> => ({
  ok: true,
  value,
});

export const Err = <E>(error: E): Err<E> => ({
  ok: false,
  error,
});

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok;

export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => !result.ok;

export const unwrapOr = <T, E>(result: Result<T, E>, fallback: T): T => {
  return result.ok ? result.value : fallback;
};

export const mapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  return result.ok ? Ok(fn(result.value)) : (result as Err<E>);
};

export const flatMapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  return result.ok ? fn(result.value) : (result as Err<E>);
};

export const tryAsync = async <T, E = Error>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  errorTransformer?: (err: unknown) => E
): Promise<Result<T, E>> => {
  try {
    const value = typeof promiseOrFn === 'function' ? await promiseOrFn() : await promiseOrFn;
    return Ok(value);
  } catch (err) {
    const error = errorTransformer
      ? errorTransformer(err)
      : err instanceof Error
      ? (err as unknown as E)
      : (new Error(String(err)) as unknown as E);
    return Err(error);
  }
};
