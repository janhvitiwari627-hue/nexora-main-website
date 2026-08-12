import { NexoraRoot } from "../NexoraRoot";

export default async function RoutedPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const resolved = await params;
  return <NexoraRoot initialPath={`/${resolved.path.join("/")}`} />;
}
