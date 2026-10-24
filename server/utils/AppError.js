export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(msg, details) {
    return new AppError(400, msg, details);
  }

  static notFound(msg = 'Not found') {
    return new AppError(404, msg);
  }

  static forbidden(msg = 'Forbidden') {
    return new AppError(403, msg);
  }

  static upstream(msg = 'Upstream service failed', details) {
    return new AppError(502, msg, details);
  }
}
