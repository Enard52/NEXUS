#!/usr/bin/env node
/* İzlenen git kancalarını kurar (package.json "prepare" -> her install/klonda otomatik).
   Neden: kodlama pre-commit kancası eskiden yalnızca .git/hooks altında yaşıyordu; izlenmeyen
   dosya olduğu için taze klonda, başka makinede ve iş ağacında (worktree) hiç yoktu — mojibake
   ancak CI testinde yakalanıyordu. Artık kaynak scripts/git-hooks/ altında izleniyor ve bu betik
   çalıştıran kopyayı git'in kendi hooks yoluna yerleştiriyor.

   Yalnızca scripts/git-hooks/ içindeki adları yazar; kullanıcının başka kancalarına dokunmaz.
   Git deposu yoksa (arşivden kurulum vb.) sessizce geçer: install bir kodlama kapısı değildir. */
import { chmodSync, copyFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "scripts", "git-hooks");

let hooksDir = "";
try {
  hooksDir = execFileSync("git", ["rev-parse", "--git-path", "hooks"], {
    cwd: ROOT,
    encoding: "utf8",
  }).trim();
} catch {
  console.log("install-hooks: git deposu bulunamadı, atlandı.");
  process.exit(0);
}
if (!hooksDir) {
  console.log("install-hooks: git hooks yolu boş, atlandı.");
  process.exit(0);
}
const dst = join(ROOT, hooksDir);
if (!existsSync(dst) || !existsSync(SRC)) {
  console.log("install-hooks: kaynak ya da hedef klasör yok, atlandı.");
  process.exit(0);
}

const installed = [];
for (const name of readdirSync(SRC)) {
  const from = join(SRC, name);
  const to = join(dst, name);
  copyFileSync(from, to);
  chmodSync(to, 0o755);
  installed.push(name);
}
console.log(
  `install-hooks: ${installed.length} kanca kuruldu (${installed.join(", ")}) -> ${hooksDir}`,
);
