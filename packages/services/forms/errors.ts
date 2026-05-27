export class FormsServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "BAD_REQUEST"
      | "NOT_FOUND"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "TOO_MANY_REQUESTS"
      | "PAYLOAD_TOO_LARGE" = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "FormsServiceError";
  }
}
