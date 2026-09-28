"""Create a source handoff archive without local state, dependencies, or secrets."""

from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import os

root = Path(__file__).resolve().parents[1]
output = root.parent / "ONUR-Task-Manager-source.zip"
temporary = root.parent / "ONUR-Task-Manager-source.new.zip"

top_level = {
    ".gitignore", ".npmrc", ".env.example", "cloudflare-env.d.ts",
    "components.json", "drizzle.config.ts", "eslint.config.mjs",
    "next-env.d.ts", "next.config.ts", "package-lock.json",
    "package.json", "postcss.config.mjs", "README.md",
    "tsconfig.json", "vite.config.ts",
}
directories = {
    "app", "components", "db", "drizzle", "hooks", "lib", "public",
    "scripts", "build", "docs", "tests", "vendor", "examples",
}
excluded_names = {".dev.vars", ".env", ".DS_Store"}
excluded_suffixes = {".sqlite", ".db", ".log", ".exe", ".zip", ".pem", ".key", ".p12", ".pfx"}

files = [root / name for name in sorted(top_level) if (root / name).is_file()]
hosting = root / ".openai" / "hosting.json"
if hosting.is_file():
    files.append(hosting)
for directory in sorted(directories):
    folder = root / directory
    if not folder.is_dir():
        continue
    for path in folder.rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        if path.name in excluded_names or path.name.startswith(".dev.vars"):
            continue
        if path.suffix.lower() in excluded_suffixes:
            continue
        files.append(path)

if len(files) < 100:
    raise RuntimeError("Source archive is unexpectedly small; refusing to replace it")
with ZipFile(temporary, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(files):
        archive.write(path, path.relative_to(root).as_posix())
with ZipFile(temporary) as archive:
    bad = archive.testzip()
    if bad:
        raise RuntimeError(f"Archive verification failed: {bad}")
    if any(name.startswith(("node_modules/", "work/", ".wrangler/")) or ".dev.vars" in name for name in archive.namelist()):
        raise RuntimeError("Archive contains local state or secrets")
os.replace(temporary, output)
print(f"{output} ({len(files)} files, {output.stat().st_size} bytes)")
