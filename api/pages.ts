import worker, { type Env } from './worker';
interface PagesEnv extends Env { ASSETS: { fetch(request: Request): Promise<Response> } }
export default {
  fetch(request: Request, env: PagesEnv): Promise<Response> {
    const path = new URL(request.url).pathname;
    return path.startsWith('/api/') || path === '/health' ? worker.fetch(request, env) : env.ASSETS.fetch(request);
  },
};
