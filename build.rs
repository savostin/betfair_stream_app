fn main() {
  tauri_build::build();

  println!("cargo:rerun-if-env-changed=BETFAIR_APP_KEY");
  println!("cargo:rerun-if-env-changed=TAURI_SKIP_UI_BUILD");
  println!("cargo:rerun-if-changed=.env");

  // For local builds, allow `BETFAIR_APP_KEY` to be provided via `.env`.
  // (Cargo build scripts do not automatically load `.env`.)
  if std::env::var("BETFAIR_APP_KEY").ok().as_deref() == Some("")
    || std::env::var("BETFAIR_APP_KEY").is_err()
  {
    let manifest_dir = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let env_path = manifest_dir.join(".env");
    if let Ok(env_text) = std::fs::read_to_string(&env_path) {
      for raw_line in env_text.lines() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with('#') {
          continue;
        }

        let Some((k, v)) = line.split_once('=') else { continue; };
        if k.trim() != "BETFAIR_APP_KEY" {
          continue;
        }

        let mut v = v.trim().to_string();
        // Strip optional surrounding quotes.
        if (v.starts_with('"') && v.ends_with('"')) || (v.starts_with('\'') && v.ends_with('\'')) {
          v = v[1..v.len().saturating_sub(1)].to_string();
        }

        if !v.trim().is_empty() {
          std::env::set_var("BETFAIR_APP_KEY", v);
        }

        break;
      }
    }
  }

  // Ensure the UI is built for release bundles.
  // Tauri expects `build.frontendDist` (ui/dist) to exist when bundling.
  if std::env::var("PROFILE").as_deref() == Ok("release")
    && std::env::var("TAURI_SKIP_UI_BUILD").ok().as_deref() != Some("1")
  {
    let manifest_dir = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let ui_dir = manifest_dir.join("ui");

    println!("cargo:rerun-if-changed=ui/package.json");
    println!("cargo:rerun-if-changed=ui/package-lock.json");
    println!("cargo:rerun-if-changed=ui/index.html");
    println!("cargo:rerun-if-changed=ui/vite.config.ts");
    println!("cargo:rerun-if-changed=ui/tsconfig.json");
    println!("cargo:rerun-if-changed=ui/tsconfig.app.json");
    println!("cargo:rerun-if-changed=ui/tsconfig.node.json");
    println!("cargo:rerun-if-changed=ui/src");

    if !ui_dir.exists() {
      panic!("UI directory not found at: {}", ui_dir.display());
    }

    let npm = if cfg!(windows) { "npm.cmd" } else { "npm" };
    let status = std::process::Command::new(npm)
      .current_dir(&manifest_dir)
      .args(["--prefix", ui_dir.to_string_lossy().as_ref(), "run", "build"])
      .status()
      .expect("failed to spawn npm (is Node.js installed?)");

    if !status.success() {
      panic!("UI build failed (npm exit status: {status})");
    }
  }

  if let Ok(v) = std::env::var("BETFAIR_APP_KEY") {
    let v = v.trim().to_string();
    if !v.is_empty() {
      // Embed into the binary at compile time.
      println!("cargo:rustc-env=BETFAIR_APP_KEY={v}");
    }
  }
}
