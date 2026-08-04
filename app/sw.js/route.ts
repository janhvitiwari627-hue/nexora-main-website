/** The Main Website is not a PWA host. Portal service workers are owned by
 * their Vite deployments and are mounted under /app/<role>/. */
export function GET() {
  return new Response("Not Found", { status: 404 });
}
