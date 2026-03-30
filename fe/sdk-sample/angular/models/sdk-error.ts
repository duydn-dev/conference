export class SdkError extends Error {
  get code(): string {
    return this._code;
  }

  private readonly _code: string;
  constructor(message: string, code: string) {
    super(message);
    this._code = code;
  }
}
