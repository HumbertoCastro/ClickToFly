export function assert(
  condition: unknown,
  message = "Expected condition to be truthy",
): asserts condition {
  if (!condition) throw new Error(message);
}

export function assertEquals(actual: unknown, expected: unknown): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`Expected ${right}, received ${left}`);
  }
}

export async function assertRejects(
  callback: () => Promise<unknown>,
  check: (error: unknown) => boolean,
): Promise<void> {
  try {
    await callback();
  } catch (error) {
    assert(check(error), `Unexpected rejection: ${String(error)}`);
    return;
  }
  throw new Error("Expected promise to reject");
}
