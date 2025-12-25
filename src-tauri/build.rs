fn main() {
  tauri_build::build();

  println!("cargo:rerun-if-env-changed=BETFAIR_APP_KEY");

  if let Ok(v) = std::env::var("BETFAIR_APP_KEY") {
    let v = v.trim().to_string();
    if !v.is_empty() {
      // Embed into the binary at compile time.
      println!("cargo:rustc-env=BETFAIR_APP_KEY={v}");
    }
  }
}
