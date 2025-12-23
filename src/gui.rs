use std::io::Cursor;
use tao::platform::run_return::EventLoopExtRunReturn;
use tao::{
    event::{Event, StartCause},
    event_loop::{ControlFlow, EventLoop},
};
use tokio::sync::oneshot;
use tray_icon::{
    menu::{Menu, MenuEvent, MenuItem},
    Icon, TrayIconBuilder,
};

pub fn run_gui(
    shutdown_tx: oneshot::Sender<()>,
    server_err_rx: std::sync::mpsc::Receiver<String>,
) -> Result<(), Box<dyn std::error::Error>> {
    let menu = Menu::new();
    let exit_item = MenuItem::new("Exit", true, None);
    menu.append(&exit_item)?;

    // Load the tray icon from a real asset.
    // We store it as an .ico and decode it to RGBA for cross-platform use.
    let icon_bytes: &[u8] = include_bytes!("../assets/icon.ico");
    let icon_dir = ico::IconDir::read(Cursor::new(icon_bytes))?;
    let best_entry = icon_dir
        .entries()
        .iter()
        .max_by_key(|e| e.width() * e.height())
        .ok_or("icon.ico has no entries")?;
    let icon_image = best_entry.decode()?;
    let icon = Icon::from_rgba(
        icon_image.rgba_data().to_vec(),
        icon_image.width(),
        icon_image.height(),
    )?;

    let app_name = env!("CARGO_PKG_NAME").replace('_', " ");
    let app_version = env!("CARGO_PKG_VERSION");
    let base_tooltip = format!("{app_name} v{app_version}");

    let tray = TrayIconBuilder::new()
        .with_tooltip(base_tooltip.clone())
        .with_menu(Box::new(menu))
        .with_icon(icon)
        .build()?;

    let mut event_loop = EventLoop::new();
    let menu_rx = MenuEvent::receiver();

    let mut shown_fatal_error_dialog = false;

    // On macOS, the UI event loop must be on the main thread.
    // run_return lets us exit cleanly when the Exit menu item is clicked.
    let mut shutdown_tx = Some(shutdown_tx);
    event_loop.run_return(move |event, _target, control_flow| {
        *control_flow = ControlFlow::Wait;

        if let Event::NewEvents(StartCause::Init) = event {}

        while let Ok(err) = server_err_rx.try_recv() {
            let tooltip = format!("{base_tooltip} (ERROR: {err})");
            let _ = tray.set_tooltip(Some(tooltip));

            // In GUI mode, server failures can be invisible (especially on Windows where
            // the GUI binary has no console). Treat any server error as fatal: show a dialog once
            // and exit.
            if !shown_fatal_error_dialog {
                shown_fatal_error_dialog = true;
                let _ = rfd::MessageDialog::new()
                    .set_title(&app_name)
                    .set_description(format!("Server error:\n\n{err}"))
                    .set_level(rfd::MessageLevel::Error)
                    .show();

                if let Some(tx) = shutdown_tx.take() {
                    let _ = tx.send(());
                }
                *control_flow = ControlFlow::Exit;
                break;
            }
        }

        while let Ok(menu_event) = menu_rx.try_recv() {
            if menu_event.id == exit_item.id() {
                if let Some(tx) = shutdown_tx.take() {
                    let _ = tx.send(());
                }
                *control_flow = ControlFlow::Exit;
                break;
            }
        }
    });

    Ok(())
}
