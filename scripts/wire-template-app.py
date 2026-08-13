from pathlib import Path
import re

path = Path("app/nexora-app.tsx")
text = path.read_text()
pattern = re.compile(
    r"function TemplateWorkspaceHost\(\{[\s\S]*?\n\}\n\nfunction UnavailableAuthenticatedPortal",
    re.MULTILINE,
)
replacement = '''function TemplateWorkspaceHost(_props: {
  userId?: string;
  salonIds: string[];
  navigate: (path: string) => void;
  signOut: (destination?: string) => Promise<void>;
}) {
  useEffect(() => {
    const query = window.location.search || "";
    window.location.replace(`/template-app/index.html${query}`);
  }, []);

  return <main className="center-page"><div className="loader" aria-label="Opening Website Builder" /></main>;
}

function UnavailableAuthenticatedPortal'''
updated, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f"Expected one TemplateWorkspaceHost block, replaced {count}")
path.write_text(updated)
