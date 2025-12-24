pub mod app;
pub mod codec;
pub mod config;
pub mod error;
pub mod upstream;

pub mod variants;

// Back-compat module paths (bins and internal code expect these names).
#[cfg(feature = "gui")]
pub use variants::gui_tray as gui;

#[cfg(windows)]
pub use variants::windows_service;
