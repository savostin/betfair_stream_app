#![cfg_attr(windows, windows_subsystem = "windows")]

fn main() {
    // Force GUI mode (tray) for the GUI executable.
    betfair_stream_proxy::app::run_from_cli(true);
}
