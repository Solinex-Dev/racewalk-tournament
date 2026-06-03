// Normalize lcov source paths to forward slashes so the coverage report matches
// SonarQube's source index (which always uses POSIX separators), even when the
// report is generated on Windows.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const file = "coverage/lcov.info";
if (existsSync(file)) {
  writeFileSync(file, readFileSync(file, "utf8").replaceAll("\\", "/"));
  console.log("normalize-lcov: converted backslashes to forward slashes in", file);
} else {
  console.log("normalize-lcov: no", file, "found (skipped)");
}
