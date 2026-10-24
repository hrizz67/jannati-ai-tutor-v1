// Test-only shape of the Workers runtime base class. This keeps Node unit tests
// honest about constructor state while Wrangler/workerd resolves the real module.
export class DurableObject {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
}
