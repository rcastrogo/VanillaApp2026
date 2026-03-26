
import { logFetchParams, type HttpMethod, type WrappedFetchResponse, wrappedFetch } from './http-client.utils';

/**
 * A fluent builder for executing typed API requests using `wrappedFetch`,
 * integrated with `logFetchParams` for structured and consistent API calls.
 *
 * This allows composing HTTP requests with payloads, methods, logging,
 * response transforms, and contextual metadata — all in a clean, chainable API.
 *
 * @example
 * ```ts
 * return createApiRequest<User>()
 *   .useLog("User insertion")
 *   .usePayload({ user, aspiring_role })
 *   .postTo("create-user-aspiring-role/")
 *   .useTransform(data => ({ ...data, id: Number(data.id) }))
 *   .invoke();
 * ```
 */
export function createApiRequest<T>() {
  // Internal configuration state
  let _base: string | undefined;
  let _property: string | undefined;
  let _target: string | undefined;
  let _context: string | undefined;
  let _payload: unknown;
  let _method: HttpMethod = 'GET';
  let _transform: ((data: T) => T) | undefined;
  let _accessToken: string;

  return {
    /**
 * Sets the name of wrapped object.
 *
 * @param name - Name of target result.
 */
    useBase(value: string) {
      _base = value;
      return this;
    },
    /**
     * Sets the name of wrapped object.
     *
     * @param name - Name of target result.
     */
    useProperty(name: string) {
      _property = name;
      return this;
    },
    /**
     * Sets a descriptive log or context name for this API call.
     *
     * @param context - Human-readable label for logging and debugging.
     */
    useLog(context: string) {
      _context = context;
      return this;
    },

    /**
     * Assigns a payload to be included in the request body.
     *
     * @param payload - The JSON-serializable payload object.
     */
    usePayload(payload: unknown) {
      _payload = payload;
      return this;
    },

    /**
     * Sets a transformation function that processes the response data
     * before returning it to the caller.
     *
     * @param transform - Function that maps the API response to another shape.
     */
    useTransform(transform: (data: T) => T) {
      _transform = transform;
      return this;
    },

    /**
     * Specifies a GET endpoint.
     *
     * @param target - The target or endpoint URL (relative or absolute).
     */
    getFrom(target: string) {
      _target = target;
      _method = 'GET';
      return this;
    },

    /**
     * Specifies a POST endpoint.
     *
     * @param target - The target or endpoint URL (relative or absolute).
     */
    postTo(target: string) {
      _target = target;
      _method = 'POST';
      return this;
    },

    /**
     * Specifies a PUT endpoint.
     *
     * @param target - The target or endpoint URL (relative or absolute).
     */
    putTo(target: string) {
      _target = target;
      _method = 'PUT';
      return this;
    },

    /**
     * Specifies a PATCH endpoint.
     *
     * @param target - The target or endpoint URL (relative or absolute).
     */
    patchTo(target: string) {
      _target = target;
      _method = 'PATCH';
      return this;
    },

    /**
     * Specifies a DELETE endpoint.
     *
     * @param target - The target or endpoint URL (relative or absolute).
     */
    deleteFrom(target: string) {
      _target = target;
      _method = 'DELETE';
      return this;
    },

    useToken(token: string) {
      _accessToken = token;
      return this;
    },

    /**
     * Executes the composed API request using `wrappedFetch`.
     * Automatically logs parameters and applies transformations if defined.
     */
    async invoke(): Promise<WrappedFetchResponse<T> | string> {
      if (!_target) throw new Error('Target endpoint not defined. Use .getFrom(), .postTo(), etc.');
      const { url, payload, method } = logFetchParams((_base || '') + _target, _payload, _method);
      return wrappedFetch<T>(
        () =>
          fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(_accessToken ? { Authorization: `Bearer ${_accessToken}` } : {}),
            },
            ...(payload ? { body: JSON.stringify(payload) } : {}),
          }),
        _property,
        _context,
        _transform
      );
    },
  };
}
