/**
 * Validates a URI component and safely encodes it.
 *
 * Ensures the component contains only allowed characters (alphanumeric, `_`, `-` by default),
 * throws an error if invalid, and returns a URI-encoded string.
 *
 * @param component - The string to validate and encode
 * @param name - Optional name for the component, used in error messages
 * @returns The encoded URI component
 * @throws Error if the component is invalid
 */
export function assertAndEncodeURIComponent(
  component: string,
  name: string = "URI component",
): string {
  const trimmed = component.trim();

  if (trimmed.length === 0) {
    throw new Error(`${name} cannot be empty`);
  }

  // Allow only alphanumeric, underscore, dash by default
  const pattern = /^[a-zA-Z0-9_-]+$/;
  if (!pattern.test(trimmed)) {
    throw new Error(
      `Invalid ${name}: only letters, numbers, _ and - are allowed`,
    );
  }

  return encodeURIComponent(trimmed);
}
